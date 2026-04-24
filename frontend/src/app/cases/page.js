"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import CaseTable from "../../components/cases/CaseTable";
import EditCaseModal from "../../components/cases/EditCaseModal";
import FilterBar from "../../components/cases/FilterBar";
import Pagination from "../../components/cases/Pagination";
import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

const DEFAULT_LIMIT = 10;

const normalizeStatusForApi = (value) => {
  if (!value) {
    return "";
  }
  return String(value).trim().toLowerCase();
};

const buildChangedPayload = (selectedCase, formData) => {
  if (!selectedCase) {
    return {};
  }

  const payload = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    location: formData.location.trim(),
    crime_type: formData.crime_type.trim(),
    status: formData.status,
    date: formData.date,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      const currentValue = selectedCase?.[key];

      if (key === "date") {
        const leftDate = new Date(value);
        const rightDate = new Date(currentValue);

        if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
          return true;
        }

        return leftDate.toISOString().slice(0, 10) !== rightDate.toISOString().slice(0, 10);
      }

      return String(currentValue || "").trim() !== String(value || "").trim();
    })
  );
};

export default function CasesPage() {
  const { isChecking, isAuthorized } = useAuthGuard();

  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageLimit, setPageLimit] = useState(DEFAULT_LIMIT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [primaryTypeFilter, setPrimaryTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [crimeTypeCache, setCrimeTypeCache] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchCases = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const params = {
        page,
        limit: DEFAULT_LIMIT,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (statusFilter) {
        params.status = normalizeStatusForApi(statusFilter);
      }

      if (primaryTypeFilter) {
        params.crime_type = primaryTypeFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await api.get("/cases", { params });
      const nextCases = response.data?.cases || [];
      setCases(nextCases);
      setTotal(response.data?.total || 0);
      setPage(response.data?.page || 1);
      setTotalPages(response.data?.totalPages || 0);
      setPageLimit(response.data?.limit || DEFAULT_LIMIT);
      setCrimeTypeCache((prev) => {
        const merged = new Set(prev);
        nextCases.forEach((caseItem) => {
          if (typeof caseItem?.crime_type === "string" && caseItem.crime_type.trim()) {
            merged.add(caseItem.crime_type.trim());
          }
        });
        return [...merged].sort((left, right) => left.localeCompare(right));
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load cases.");
      setCases([]);
      setTotal(0);
      setTotalPages(0);
      setPageLimit(DEFAULT_LIMIT);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized, page, debouncedSearch, statusFilter, primaryTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const crimeTypeOptions = useMemo(() => {
    return crimeTypeCache;
  }, [crimeTypeCache]);

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPrimaryTypeFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setError("");
  };

  const openEditModal = (caseItem) => {
    setSelectedCase(caseItem);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSaving) {
      return;
    }

    setIsEditModalOpen(false);
    setSelectedCase(null);
  };

  const handleSaveCase = async (formData) => {
    if (!selectedCase?._id) {
      return;
    }

    const payload = buildChangedPayload(selectedCase, formData);

    if (Object.keys(payload).length === 0) {
      closeEditModal();
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/cases/${selectedCase._id}`, payload);
      closeEditModal();
      await fetchCases();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update case.");
    } finally {
      setIsSaving(false);
    }
  };

  const onPageChange = (nextPage) => {
    if (nextPage === page || nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) {
      return;
    }

    setPage(nextPage);
  };

  const pageStart = total === 0 ? 0 : (page - 1) * pageLimit + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * pageLimit, total);

  if (isChecking) {
    return <div className="cims-card px-6 py-8 text-sm text-text-secondary">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-8">
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        statusValue={statusFilter}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        primaryTypeValue={primaryTypeFilter}
        onPrimaryTypeChange={(value) => {
          setPrimaryTypeFilter(value);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(value) => {
          setStartDate(value);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(value) => {
          setEndDate(value);
          setPage(1);
        }}
        crimeTypeOptions={crimeTypeOptions}
        onClearFilters={clearFilters}
      />

      <div className="mt-6">
        {error ? (
          <div className="mb-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-primary">
            {error}
          </div>
        ) : null}

        {!isLoading && cases.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-10 text-center shadow-lg shadow-black/20">
            <h2 className="text-text-primary text-xl font-semibold">No cases found</h2>
            <p className="text-text-secondary mt-2 text-sm">
              Try adjusting filters or create a new case file to get started.
            </p>
          </section>
        ) : (
          <CaseTable cases={cases} isLoading={isLoading} onEdit={openEditModal} />
        )}
      </div>

      {!isLoading && total > 0 ? (
        <div className="mt-5 rounded-3xl border border-border bg-card px-5 py-4 shadow-lg shadow-black/20">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            total={total}
            pageStart={pageStart}
            pageEnd={pageEnd}
          />
        </div>
      ) : null}

      <EditCaseModal
        caseItem={selectedCase}
        isOpen={isEditModalOpen}
        isSaving={isSaving}
        onClose={closeEditModal}
        onSave={handleSaveCase}
      />
    </div>
  );
}
