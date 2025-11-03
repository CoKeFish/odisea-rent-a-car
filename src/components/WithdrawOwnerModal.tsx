import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

interface WithdrawOwnerModalProps {
    closeModal: () => void;
    onWithdraw: (owner: string, amount: number) => Promise<void>;
    availableAmount: number;
    ownerAddress: string;
}

export default function WithdrawOwnerModal({
    closeModal,
    onWithdraw,
    availableAmount,
    ownerAddress,
}: WithdrawOwnerModalProps) {
    const [amountInXlm, setAmountInXlm] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate and normalize available amount
    const validAvailableAmount = 
        !isNaN(availableAmount) && 
        isFinite(availableAmount) && 
        availableAmount > 0 
            ? availableAmount 
            : 0;
    
    const availableAmountInXlm = validAvailableAmount / ONE_XLM_IN_STROOPS;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const amountValue = parseFloat(amountInXlm);
        // Validate amount before submitting
        if (isNaN(amountValue) || !isFinite(amountValue) || amountValue <= 0) {
            toast.error("Por favor ingresa un monto válido para retirar.");
            return;
        }

        const amountInStroops = amountValue * ONE_XLM_IN_STROOPS;
        
        if (amountInStroops > validAvailableAmount) {
            toast.error("El monto excede el balance disponible.");
            return;
        }

        setIsSubmitting(true);

        try {
            await onWithdraw(ownerAddress, amountInStroops);
            // El toast de éxito se maneja en CarList
            closeModal();
        } catch (error) {
            // Solo mostrar error si el handler padre no lo maneja
            // Los errores de validación locales se muestran aquí
            if (!(error instanceof Error && error.message.includes("transacción"))) {
                console.error("Error withdrawing funds:", error);
                const errorMessage = error instanceof Error ? error.message : "Error al retirar fondos. Por favor intenta de nuevo.";
                toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMax = () => {
        if (validAvailableAmount > 0) {
            setAmountInXlm(availableAmountInXlm.toFixed(7));
        }
    };

    return (
        <Modal title="Withdraw Owner Funds" closeModal={closeModal}>
            <div className="bg-white rounded-lg px-8">
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available to Withdraw: {
                                validAvailableAmount > 0 
                                    ? availableAmountInXlm.toFixed(7)
                                    : "0.0000000"
                            } XLM
                        </label>
                        {validAvailableAmount <= 0 && (
                            <p className="text-sm text-red-600 mb-2">
                                No funds available to withdraw. Make sure the car has been returned.
                            </p>
                        )}
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
                                max={validAvailableAmount > 0 ? availableAmountInXlm : 0}
                                step="0.0000001"
                                value={amountInXlm}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Permitir campo vacío o valores numéricos válidos
                                    if (value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                                        setAmountInXlm(value);
                                    }
                                }}
                                disabled={validAvailableAmount <= 0}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Enter amount to withdraw"
                            />
                            <button
                                type="button"
                                onClick={handleMax}
                                disabled={validAvailableAmount <= 0}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                validAvailableAmount <= 0 ||
                                amountInXlm === "" ||
                                isNaN(parseFloat(amountInXlm)) ||
                                !isFinite(parseFloat(amountInXlm)) ||
                                parseFloat(amountInXlm) <= 0 ||
                                parseFloat(amountInXlm) * ONE_XLM_IN_STROOPS > validAvailableAmount
                            }
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 cursor-pointer"
                        >
                            {isSubmitting ? "Withdrawing..." : "Withdraw"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

