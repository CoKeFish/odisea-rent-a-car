import { toast } from "react-toastify";
import { ICar } from "../interfaces/car";
import { CarStatus } from "../interfaces/car-status";
import { IRentACarContract } from "../interfaces/contract";
import { UserRole } from "../interfaces/user-role";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { shortenAddress } from "../utils/shorten-address";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";
import {useStellarAccounts} from "../providers/StellarAccountProvider.tsx";
import { useState } from "react";
import useModal from "../hooks/useModal";
import RentCarModal from "./RentCarModal";
import WithdrawOwnerModal from "./WithdrawOwnerModal";

interface CarsListProps {
    cars: ICar[];
}

export const CarsList = ({ cars }: CarsListProps) => {
    const { walletAddress, selectedRole, setHashId, setCars } =
        useStellarAccounts();
    const rentModal = useModal();
    const withdrawModal = useModal();
    const [selectedCar, setSelectedCar] = useState<ICar | null>(null);
    const [ownerAvailableAmount, setOwnerAvailableAmount] = useState<number>(0);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isReturning, setIsReturning] = useState<string | null>(null);

    const handleDelete = async (owner: string) => {
        // Prevenir ejecuciones duplicadas
        if (isDeleting === owner) {
            return;
        }
        
        setIsDeleting(owner);
        try {
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const result = await contractClient.remove_car({ owner });
            const xdr = result.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            setCars((prev) => prev.filter((car) => car.ownerAddress !== owner));
            setHashId(txHash);
            toast.success("Vehículo eliminado exitosamente.");
        } catch (error) {
            console.error("Error deleting car:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al eliminar el vehículo. Por favor intenta de nuevo.";
            toast.error(errorMessage);
        } finally {
            setIsDeleting(null);
        }
    };

    const handlePayout = async (owner: string, amount: number) => {
        try {
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const result = await contractClient.payout_owner({ owner, amount });
            const xdr = result.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            setHashId(txHash);
            toast.success("Fondos retirados exitosamente.");
            
            // Refresh available amount after withdrawal
            if (selectedCar && selectedCar.ownerAddress === owner) {
                try {
                    const available = await stellarService.getOwnerAvailableToWithdraw(owner);
                    setOwnerAvailableAmount(available);
                } catch (error) {
                    console.error("Error refreshing available amount:", error);
                    setOwnerAvailableAmount(0);
                }
            }
        } catch (error) {
            console.error("Error withdrawing funds:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al retirar los fondos. Por favor intenta de nuevo.";
            toast.error(errorMessage);
            throw error; // Re-lanzar para que el modal pueda manejar el error
        }
    };

    const openWithdrawModal = async (car: ICar) => {
        setSelectedCar(car);
        try {
            // Load available amount before opening modal
            const available = await stellarService.getOwnerAvailableToWithdraw(car.ownerAddress);
            setOwnerAvailableAmount(available);
            withdrawModal.openModal();
        } catch (error) {
            console.error("Error loading available amount:", error);
            setOwnerAvailableAmount(0);
            withdrawModal.openModal();
        }
    };

    const handleRent = async (
        car: ICar,
        totalDaysToRent: number
    ) => {
        try {
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const rentalAmount = car.pricePerDay * totalDaysToRent * ONE_XLM_IN_STROOPS;
            
            // Note: Commission is automatically added to the deposit by the contract
            const result = await contractClient.rental({
                renter: walletAddress,
                owner: car.ownerAddress,
                total_days_to_rent: totalDaysToRent,
                amount: rentalAmount,
            });
            const xdr = result.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            setCars((prev) =>
                prev.map((c) =>
                    c.ownerAddress === car.ownerAddress
                        ? { ...c, status: CarStatus.RENTED }
                        : c
                )
            );
            setHashId(txHash);
            toast.success("Auto alquilado exitosamente.");
        } catch (error) {
            console.error("Error renting car:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al alquilar el auto. Por favor intenta de nuevo.";
            toast.error(errorMessage);
            throw error; // Re-lanzar para que el modal pueda manejar el error
        }
    };

    const openRentModal = (car: ICar) => {
        setSelectedCar(car);
        rentModal.openModal();
    };

    const handleReturnCar = async (car: ICar) => {
        // Prevenir ejecuciones duplicadas
        if (isReturning === car.ownerAddress) {
            return;
        }
        
        setIsReturning(car.ownerAddress);
        try {
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const result = await contractClient.return_car({
                renter: walletAddress,
                owner: car.ownerAddress,
            });
            const xdr = result.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            setCars((prev) =>
                prev.map((c) =>
                    c.ownerAddress === car.ownerAddress
                        ? { ...c, status: CarStatus.AVAILABLE }
                        : c
                )
            );
            setHashId(txHash);
            toast.success("Auto devuelto exitosamente.");
        } catch (error) {
            console.error("Error returning car:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al devolver el auto. Por favor intenta de nuevo.";
            toast.error(errorMessage);
        } finally {
            setIsReturning(null);
        }
    };

    const getStatusStyle = (status: CarStatus) => {
        switch (status) {
            case CarStatus.AVAILABLE:
                return "px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800";
            case CarStatus.RENTED:
                return "px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800";
            case CarStatus.MAINTENANCE:
                return "px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800";
            default:
                return "px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800";
        }
    };

    const renderActionButton = (car: ICar) => {
        if (selectedRole === UserRole.ADMIN) {
            const isCurrentlyDeleting = isDeleting === car.ownerAddress;
            return (
                <button
                    onClick={() => void handleDelete(car.ownerAddress)}
                    disabled={isCurrentlyDeleting}
                    className="px-3 py-1 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    {isCurrentlyDeleting ? "Deleting..." : "Delete"}
                </button>
            );
        }

        if (selectedRole === UserRole.OWNER) {
            // Only show withdraw button if car status is Available (returned)
            if (car.status === CarStatus.AVAILABLE) {
                return (
                    <button
                        onClick={() => void openWithdrawModal(car)}
                        className="px-3 py-1 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-colors cursor-pointer"
                    >
                        Withdraw
                    </button>
                );
            }
            return null;
        }

        if (selectedRole === UserRole.RENTER) {
            if (car.status === CarStatus.AVAILABLE) {
                return (
                    <button
                        onClick={() => openRentModal(car)}
                        className="px-3 py-1 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Rent
                    </button>
                );
            }
            if (car.status === CarStatus.RENTED) {
                const isCurrentlyReturning = isReturning === car.ownerAddress;
                return (
                    <button
                        onClick={() => void handleReturnCar(car)}
                        disabled={isCurrentlyReturning}
                        className="px-3 py-1 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        {isCurrentlyReturning ? "Returning..." : "Return"}
                    </button>
                );
            }
        }

        return null;
    };

    return (
        <div data-test="cars-list">
            <div>
                <table className="min-w-full bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Passengers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            A/C
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price/Day
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {cars.map((car, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {car.brand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {car.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {car.color}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {car.passengers}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {car.ac ? (
                                    <span className="text-green-600">Yes</span>
                                ) : (
                                    <span className="text-red-600">No</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {shortenAddress(car.ownerAddress)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${car.pricePerDay}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={getStatusStyle(car.status)}>
                    {car.status}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {renderActionButton(car)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {rentModal.showModal && selectedCar && (
                <RentCarModal
                    closeModal={() => {
                        rentModal.closeModal();
                        setSelectedCar(null);
                    }}
                    car={selectedCar}
                    onRent={handleRent}
                />
            )}

            {withdrawModal.showModal && selectedCar && (
                <WithdrawOwnerModal
                    closeModal={() => {
                        withdrawModal.closeModal();
                        setSelectedCar(null);
                    }}
                    onWithdraw={handlePayout}
                    availableAmount={ownerAvailableAmount}
                    ownerAddress={selectedCar.ownerAddress}
                />
            )}
        </div>
    );
};