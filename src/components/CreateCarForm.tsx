import { useState } from "react";
import { toast } from "react-toastify";
import { CreateCar } from "../interfaces/create-car";
import Modal from "./Modal";

interface CreateCarFormProps {
    onCreateCar: (formData: CreateCar) => Promise<void>;
    onCancel: () => void;
}

export const CreateCarForm = ({
                                  onCreateCar,
                                  onCancel,
                              }: CreateCarFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        brand: "",
        model: "",
        color: "",
        passengers: "1",
        pricePerDay: "",
        ac: false,
        ownerAddress: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        
        if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
        } else if (type === "number") {
            // Permitir campo vacío o valores numéricos válidos
            if (value === "") {
                setFormData((prev) => ({
                    ...prev,
                    [name]: "",
                }));
            } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (name === "passengers") {
                        // Para pasajeros, solo enteros >= 1
                        const intValue = parseInt(value);
                        if (intValue >= 1 && intValue <= 10) {
                            setFormData((prev) => ({
                                ...prev,
                                [name]: value,
                            }));
                        }
                    } else if (name === "pricePerDay") {
                        // Para precio, números >= 0
                        if (numValue >= 0) {
                            setFormData((prev) => ({
                                ...prev,
                                [name]: value,
                            }));
                        }
                    }
                }
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        
        // Validar y convertir valores numéricos antes de enviar
        const passengers = parseInt(formData.passengers);
        const pricePerDay = parseFloat(formData.pricePerDay);
        
        if (isNaN(passengers) || passengers < 1 || passengers > 10) {
            toast.error("Por favor ingresa un número válido de pasajeros (entre 1 y 10).");
            return;
        }
        
        if (isNaN(pricePerDay) || pricePerDay < 0) {
            toast.error("Por favor ingresa un precio válido por día (mayor o igual a 0).");
            return;
        }
        
        if (!formData.brand.trim() || !formData.model.trim() || !formData.color.trim()) {
            toast.error("Por favor completa todos los campos requeridos (marca, modelo y color).");
            return;
        }
        
        if (!formData.ownerAddress.trim()) {
            toast.error("Por favor ingresa la dirección del propietario.");
            return;
        }

        const carData: CreateCar = {
            brand: formData.brand,
            model: formData.model,
            color: formData.color,
            passengers,
            pricePerDay,
            ac: formData.ac,
            ownerAddress: formData.ownerAddress,
        };

        setIsSubmitting(true);

        try {
            await onCreateCar(carData);
        } catch (error) {
            console.error("Error creating car:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Create New Car" closeModal={onCancel}>
            <div className="bg-white rounded-lg px-8">
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <div>
                        <label
                            htmlFor="brand"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Brand
                        </label>
                        <input
                            id="brand"
                            name="brand"
                            type="text"
                            value={formData.brand}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="model"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Model
                        </label>
                        <input
                            id="model"
                            name="model"
                            type="text"
                            value={formData.model}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="color"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Color
                        </label>
                        <input
                            id="color"
                            name="color"
                            type="text"
                            value={formData.color}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="passengers"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Number of Passengers
                        </label>
                        <input
                            id="passengers"
                            name="passengers"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.passengers}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                            placeholder="Enter number of passengers"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="pricePerDay"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Price per Day
                        </label>
                        <input
                            id="pricePerDay"
                            name="pricePerDay"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.pricePerDay}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                            placeholder="Enter price per day"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="ownerAddress"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Owner Address
                        </label>
                        <input
                            id="ownerAddress"
                            name="ownerAddress"
                            type="text"
                            value={formData.ownerAddress}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            id="ac"
                            name="ac"
                            type="checkbox"
                            checked={formData.ac}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="ac" className="ml-2 block text-sm text-gray-700">
                            Air Conditioning
                        </label>
                    </div>

                    <div className="flex justify-end gap-4 space-x-3 pt-2 pb-6">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !formData.brand.trim() ||
                                !formData.model.trim() ||
                                !formData.color.trim() ||
                                !formData.ownerAddress.trim() ||
                                formData.passengers === "" ||
                                formData.pricePerDay === "" ||
                                isNaN(parseInt(formData.passengers)) ||
                                parseInt(formData.passengers) < 1 ||
                                parseInt(formData.passengers) > 10 ||
                                isNaN(parseFloat(formData.pricePerDay)) ||
                                parseFloat(formData.pricePerDay) < 0
                            }
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 cursor-pointer"
                        >
                            {isSubmitting ? "Creating..." : "Create Car"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};