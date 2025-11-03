import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { ICar } from "../interfaces/car";

interface RentCarModalProps {
    closeModal: () => void;
    car: ICar;
    onRent: (car: ICar, totalDaysToRent: number) => Promise<void>;
}

export default function RentCarModal({
    closeModal,
    car,
    onRent,
}: RentCarModalProps) {
    const [days, setDays] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalPrice = car.pricePerDay * days;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (days < 1) {
            toast.error("Por favor ingresa un número válido de días (mínimo 1 día)");
            return;
        }

        setIsSubmitting(true);

        try {
            await onRent(car, days);
            // El toast de éxito se maneja en CarList
            closeModal();
        } catch (error) {
            // Solo mostrar error si el handler padre no lo maneja
            // Los errores de validación locales se muestran aquí
            if (!(error instanceof Error && error.message.includes("transacción"))) {
                console.error("Error renting car:", error);
                const errorMessage = error instanceof Error ? error.message : "Error al alquilar el auto. Por favor intenta de nuevo.";
                toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Rent Car" closeModal={closeModal}>
            <div className="bg-white rounded-lg px-8">
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Car Details
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Brand:</span> {car.brand}</p>
                        <p><span className="font-medium">Model:</span> {car.model}</p>
                        <p><span className="font-medium">Color:</span> {car.color}</p>
                        <p><span className="font-medium">Price per day:</span> ${car.pricePerDay}</p>
                    </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <div>
                        <label
                            htmlFor="days"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Number of Days
                        </label>
                        <input
                            id="days"
                            name="days"
                            type="number"
                            min="1"
                            value={days}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                if (value >= 1) {
                                    setDays(value);
                                }
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                            placeholder="Enter number of days"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Minimum rental period is 1 day.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-md p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Price per day:
                            </span>
                            <span className="text-sm text-gray-900">
                                ${car.pricePerDay}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Number of days:
                            </span>
                            <span className="text-sm text-gray-900">
                                {days}
                            </span>
                        </div>
                        <div className="border-t border-gray-300 mt-2 pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-semibold text-gray-900">
                                    Total Price:
                                </span>
                                <span className="text-base font-semibold text-blue-600">
                                    ${totalPrice.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Note: Admin commission will be automatically added to the deposit.
                            </p>
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
                            disabled={isSubmitting || days < 1}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 cursor-pointer"
                        >
                            {isSubmitting ? "Renting..." : "Rent Car"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

