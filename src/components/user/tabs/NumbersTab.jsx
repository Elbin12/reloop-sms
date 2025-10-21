import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useGetNumbersQuery, useRegisterNumberMutation } from "../../../store/api/userDashboardApi";
import { useDebounce } from "../../../custom_hooks/useDebounce";

export default function NumbersTab({locationId}) {
  const [registeringId, setRegisteringId] = useState(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  const [searchTerm, setSearchTerm] = useState("");

  // debounce the search input by 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: numbers,
    isLoading: numbersLoading,
    isFetching: numbersFetching,
  } = useGetNumbersQuery({page: messagesPage, locationId:locationId, search: debouncedSearchTerm,}, { refetchOnMountOrArgChange: true });

  const [registerNumber, { isLoading: isRegistering }] =
    useRegisterNumberMutation();

  const handleRegisterClick = (number) => {
    console.log(number, "number")
    setSelectedNumber(number);
    setShowConfirmModal(true);
  };

  const handleConfirmRegister = async () => {
    setRegisteringId(selectedNumber.id);
    try {
      await registerNumber({
        number_id: selectedNumber.id,
        location_id: locationId,
      }).unwrap();
      // Optional: Show success message
      setShowConfirmModal(false);
    } catch (error) {
        console.error("Failed to register number:", error);
        alert("Failed to register number. Please try again.");
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
    setMessagesPage(1);
  };

  const ConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Confirm Registration
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to register the number{" "}
          <span className="font-mono font-bold text-gray-900">
            +{selectedNumber?.number  }
          </span>
          ?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleCancelRegister}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRegister}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const NumberCard = ({ number, showRegisterButton = false }) => (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-900 font-mono">
            +{number.number}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600">
              Price: <span className="font-semibold">${number.price}</span>
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                number.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {number.is_active ? "Active" : "Inactive"}
            </span>
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
            onClick={() => handleRegisterClick(number)}
            disabled={registeringId === number.id}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {registeringId === number.id ? "Registering..." : "Register"}
          </button>
        )}
      </div>
    </div>
  );

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
    available: numbers?.available,
    registered: numbers?.registered,
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
              {numbers?.available?.count || 0}
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
            Registered
            <span className="ml-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">
              {numbers?.registered?.count || 0}
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
        <div className="bg-white rounded-lg shadow-sm border p-4">
          {/* Search - only show for available numbers */}
          {activeTab === "available" && currentData?.results?.length > 0 &&(
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search available numbers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setMessagesPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Numbers List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                  Showing {(messagesPage - 1) * 10 + 1}–
                  {(messagesPage - 1) * 10 + currentData.results.length} of{" "}
                  {currentData.count}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMessagesPage((p) => Math.max(1, p - 1))}
                  disabled={!currentData.previous}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setMessagesPage((p) => p + 1)}
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