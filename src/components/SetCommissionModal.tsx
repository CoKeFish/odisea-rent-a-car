import { useState } from "react";
import Modal from "./Modal";

interface SetCommissionModalProps {
    closeModal: () => void;
    onSetCommission: (commission: number) => Promise<void>;
}

export default function SetCommissionModal({
    closeModal,
    onSetCommission,
}: SetCommissionModalProps) {
    const [commission, setCommission] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSetCommission(commission);
            closeModal();
        } catch (error) {
            console.error("Error setting commission:", error);
            alert("Error setting commission. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Set Admin Commission" closeModal={closeModal}>
            <div className="bg-white rounded-lg px-8">
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <div>
                        <label
                            htmlFor="commission"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Commission Amount (in XLM)
                        </label>
                        <input
                            id="commission"
                            name="commission"
                            type="number"
                            min="0"
                            value={commission}
                            onChange={(e) => setCommission(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                            placeholder="Enter commission amount"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            This commission will be automatically added to each rental deposit. Enter amount in XLM (will be converted to stroops).
                        </p>
                    </div>

                    <div className="flex justify-end gap-4 space-x-3 pt-2 pb-6">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || commission < 0}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 cursor-pointer"
                        >
                            {isSubmitting ? "Setting..." : "Set Commission"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

