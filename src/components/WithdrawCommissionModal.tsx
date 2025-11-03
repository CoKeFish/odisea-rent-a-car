import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

interface WithdrawCommissionModalProps {
    closeModal: () => void;
    onWithdraw: (amount: number) => Promise<void>;
    availableAmount: number;
}

export default function WithdrawCommissionModal({
    closeModal,
    onWithdraw,
    availableAmount,
}: WithdrawCommissionModalProps) {
    const [amountInXlm, setAmountInXlm] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const amountInStroops = amountInXlm * ONE_XLM_IN_STROOPS;
            await onWithdraw(amountInStroops);
            // El toast de éxito se maneja en Dashboard
            closeModal();
        } catch (error) {
            // Solo mostrar error si el handler padre no lo maneja
            // Los errores de validación locales se muestran aquí
            if (!(error instanceof Error && error.message.includes("transacción"))) {
                console.error("Error withdrawing commission:", error);
                const errorMessage = error instanceof Error ? error.message : "Error al retirar la comisión. Por favor intenta de nuevo.";
                toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMax = () => {
        setAmountInXlm(availableAmount / ONE_XLM_IN_STROOPS);
    };

    return (
        <Modal title="Withdraw Admin Commission" closeModal={closeModal}>
            <div className="bg-white rounded-lg px-8">
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available Commission: {availableAmount / ONE_XLM_IN_STROOPS} XLM
                        </label>
                        <label
                            htmlFor="amountInXlm"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Withdraw Amount (in XLM)
                        </label>
                        <div className="mt-1 flex gap-2">
                            <input
                                id="amountInXlm"
                                name="amountInXlm"
                                type="number"
                                min="0"
                                max={availableAmount / ONE_XLM_IN_STROOPS}
                                step="0.0000001"
                                value={amountInXlm}
                                onChange={(e) => setAmountInXlm(Number(e.target.value))}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                                placeholder="Enter amount to withdraw"
                            />
                            <button
                                type="button"
                                onClick={handleMax}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                            >
                                Max
                            </button>
                        </div>
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
                            disabled={
                                isSubmitting ||
                                amountInXlm <= 0 ||
                                amountInXlm * ONE_XLM_IN_STROOPS > availableAmount
                            }
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 cursor-pointer"
                        >
                            {isSubmitting ? "Withdrawing..." : "Withdraw"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

