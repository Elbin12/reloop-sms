import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useGetNumbersQuery, useRegisterNumberMutation } from "../../../store/api/userDashboardApi";
import { useDebounce } from "../../../custom_hooks/useDebounce";

export default function NumbersTab({locationId}) {
  const [registeringId, setRegisteringId] = useState(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);

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
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2].map((j) => (
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
        ))}
      </div>
    );
  }

  return (
    <>
      {showConfirmModal && <ConfirmationModal />}
      <div className="space-y-6">
        {/* Available Numbers */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Available Numbers</h3>
            <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
              {numbers?.available?.count || 0} available
            </span>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search available numbers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setMessagesPage(1); // reset page on new search
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {numbers?.available?.results?.length > 0 ? (
              numbers.available.results.map((number) => (
                <NumberCard
                  key={number.id}
                  number={number}
                  showRegisterButton={true}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No available numbers
              </p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Showing {(messagesPage - 1) * 10 + 1}–
                {(messagesPage - 1) * 10 + numbers.available.results.length} of{" "}
                {numbers.available.count}
              </p>
            </div>
            <div className="flex gap-2">
                <button
                onClick={() =>
                    setMessagesPage((p) => Math.max(1, p - 1))
                }
                disabled={!numbers?.available.previous}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                Previous
                </button>
                <button
                onClick={() => setMessagesPage((p) => p + 1)}
                disabled={!numbers?.available.next}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                Next
                </button>
            </div>
          </div>
        </div>

        {/* Registered Numbers */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Registered Numbers</h3>
            <span className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
              {numbers?.registered?.count || 0} registered
            </span>
          </div>
          <div className="space-y-3">
            {numbers?.registered?.results?.length > 0 ? (
              numbers.registered.results.map((number) => (
                <NumberCard key={number.id} number={number} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No registered numbers
              </p>
            )}
          </div>
        </div>

        {/* Owned Numbers */}
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Owned Numbers</h3>
            <span className="text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full">
              {numbers?.owned?.count || 0} owned
            </span>
          </div>
          <div className="space-y-3">
            {numbers?.owned?.results?.length > 0 ? (
              numbers.owned.results.map((number) => (
                <NumberCard key={number.id} number={number} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No owned numbers</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}