import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useGetNumbersQuery, useRegisterNumberMutation, useRequestPremiumNumberMutation } from "../../../store/api/userDashboardApi";
import { useDebounce } from "../../../custom_hooks/useDebounce";
import { useGetAvailableNumbersQuery } from "../../../store/api/dashboardApi";

export default function NumbersTab({locationId}) {
  const [registeringId, setRegisteringId] = useState(null);
  const [Page, setPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("price_asc");

  const [requestingPremiumId, setRequestingPremiumId] = useState(null);

  // debounce the search input by 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
      data: numbersData,
      isLoading,
      isFetching,
      error,
      refetch,
    } = useGetAvailableNumbersQuery({ 
      page: Page,
      search: debouncedSearchTerm,
      label: labelFilter,
      price_min: priceMin,
      price_max: priceMax,
      sort_by: sortBy,
    })

  const {
    data: numbers,
    isLoading: numbersLoading,
    isFetching: numbersFetching,
  } = useGetNumbersQuery({page: Page, locationId:locationId, search: debouncedSearchTerm,}, { refetchOnMountOrArgChange: true });

  const [registerNumber, { isLoading: isRegistering }] =
    useRegisterNumberMutation();

  const [requestPremiumNumber, { isLoading: isRequestingPremium }] = useRequestPremiumNumberMutation();


  const handleRegisterClick = (number, isPremium = false) => {
    console.log(number, "number", isPremium ? "premium" : "standard");
    setSelectedNumber({ ...number, isPremium });
    setShowConfirmModal(true);
  };

  const handleConfirmRegister = async () => {
    const isPremium = selectedNumber.isPremium;
    
    if (isPremium) {
      setRequestingPremiumId(selectedNumber.id);
    } else {
      setRegisteringId(selectedNumber.id);
    }

    try {
      if (isPremium) {
        await registerNumber({
          number: selectedNumber.number,
          location_id: locationId,
        }).unwrap();
      } else {
        await registerNumber({
          number: selectedNumber.number,
          location_id: locationId,
        }).unwrap();
      }

      setShowConfirmModal(false);
    } catch (error) {
        console.error(`Failed to ${isPremium ? 'request' : 'register'} number:`, error);
        alert(`Failed to ${isPremium ? 'request' : 'register'} number. Please try again.`);
    }
    setRegisteringId(null);
  };

  const handleCancelRegister = () => {
    setShowConfirmModal(false);
    setSelectedNumber(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setLabelFilter("");
    setPriceMin("");
    setPriceMax("");
    setSortBy("price_asc");
    setPage(1);
  };

  const ConfirmationModal = () => {
    const isPremium = selectedNumber?.isPremium;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isPremium ? 'Request Premium Number' : 'Confirm Registration'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isPremium 
              ? 'You are requesting a premium number. This will be reviewed and you will be notified once approved.'
              : 'Are you sure you want to buy this number?'}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Number</span>
              <span className="font-mono font-bold text-gray-900">
                +{selectedNumber?.number}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Type</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isPremium 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedNumber?.label || (isPremium ? 'Premium' : 'Standard')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Price</span>
              <span className="text-lg font-bold text-gray-900">
                {selectedNumber?.display_price || `$${selectedNumber?.price}`}
              </span>
            </div>
          </div>
          {isPremium && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Premium numbers require approval. You will be notified once your request is processed.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCancelRegister}
              disabled={isRegistering || isRequestingPremium}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRegister}
              disabled={isRegistering || isRequestingPremium}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isPremium 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {(isRegistering || isRequestingPremium) 
                ? 'Processing...' 
                : isPremium 
                  ? 'Request Number' 
                  : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NumberCard = ({ number, showRegisterButton = false }) => {
    const canAutoRegister = number.can_auto_register;
    const isProcessing = registeringId === number.id || requestingPremiumId === number.id;

    return (
      <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-900 font-mono">
              +{number.number}
            </p>
            {number.label && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                number.label === 'Premium' 
                  ? 'bg-orange-100 text-orange-700'
                  : number.label === 'Standard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                {number.label}
              </span>
            )}
            <div className="flex items-center gap-2 mt-2">
              {/* <span className="text-sm text-gray-600">
                Price: <span className="font-semibold">${number.price}</span>
              </span> */}
              {/* <span
                className={`text-xs px-2 py-1 rounded-full ${
                  number.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {number.is_active ? "Active" : "Inactive"}
              </span> */}
            </div>
            {number.last_synced_at && (
              <p className="text-xs text-gray-500 mt-1">
                Synced{" "}
                {formatDistanceToNow(new Date(number.last_synced_at), {
                  addSuffix: true,
                })}
              </p>
            )}
            {number.registered_at && (
              <p className="text-xs text-gray-500">
                Registered{" "}
                {formatDistanceToNow(new Date(number.registered_at), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
          {showRegisterButton && (
            <button
              onClick={() => handleRegisterClick(number, !canAutoRegister)}
              disabled={registeringId === number.id}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isProcessing 
                ? 'Processing...' 
                : canAutoRegister 
                  ? 'Buy' 
                  : 'Request'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (numbersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-300 rounded-t animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="p-4 border border-gray-200 rounded-lg animate-pulse"
              >
                <div className="h-4 bg-gray-300 rounded w-40"></div>
                <div className="h-3 bg-gray-300 rounded w-24 mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentData = {
    available: numbersData,
    registered: numbers?.pending,
    owned: numbers?.owned,
  }[activeTab];

  return (
    <>
      {showConfirmModal && <ConfirmationModal />}
      
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-9 border-b border-gray-200">
          <button
            onClick={() => handleTabChange("available")}
            className={`py-3 font-medium text-xs md:text-sm transition-colors relative ${
              activeTab === "available"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Available
            <span className="ml-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
              {numbersData?.count || 0}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("registered")}
            className={`py-3 font-medium text-xs md:text-sm transition-colors relative ${
              activeTab === "registered"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Requested
            <span className="ml-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">
              {numbers?.pending?.count || 0}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("owned")}
            className={`py-3 font-medium text-xs md:text-sm transition-colors relative ${
              activeTab === "owned"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Owned
            <span className="ml-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700">
              {numbers?.owned?.count || 0}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
          {/* Search - only show for available numbers */}
          {activeTab === "available" && (
            <div className="flex flex-col gap-3 w-full">
              {/* Search bar */}
              <input
                type="text"
                placeholder="Search available numbers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Filters container */}
              <div className="flex flex-wrap items-center gap-2 w-full">
                {/* Min / Max Price */}
                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceMin}
                  onChange={(e) => {
                    setPriceMin(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 min-w-[130px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 min-w-[130px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Dropdowns */}
                <select
                  value={labelFilter}
                  onChange={(e) => {
                    setLabelFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Types</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          )}


          {/* Numbers List */}
          <div className="space-y-3 overflow-y-auto">
            {currentData?.results?.length > 0 ? (
              currentData.results.map((number) => (
                <NumberCard
                  key={number.id}
                  number={number}
                  showRegisterButton={activeTab === "available"}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No {activeTab} numbers
              </p>
            )}
          </div>

          {/* Pagination - only show for available numbers */}
          {activeTab === "available" && currentData?.results?.length > 0 && (
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Showing {(Page - 1) * 10 + 1}–
                  {(Page - 1) * 10 + currentData.results.length} of{" "}
                  {currentData.count}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!currentData.previous}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!currentData.next}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}