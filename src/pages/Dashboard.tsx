import { toast } from "react-toastify";
import { CarsList } from "../components/CarList";
import { CreateCarForm } from "../components/CreateCarForm";
import StellarExpertLink from "../components/StellarExpertLink";
import SetCommissionModal from "../components/SetCommissionModal";
import WithdrawCommissionModal from "../components/WithdrawCommissionModal";
import useModal from "../hooks/useModal";
import { ICar } from "../interfaces/car";
import { CarStatus } from "../interfaces/car-status";
import { IRentACarContract } from "../interfaces/contract";
import { CreateCar } from "../interfaces/create-car";
import { UserRole } from "../interfaces/user-role";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";
import {useStellarAccounts} from "../providers/StellarAccountProvider.tsx";
import {useEffect, useRef, useState} from "react";

export default function Dashboard() {
    const { hashId, cars, walletAddress, setCars, setHashId, selectedRole } =
        useStellarAccounts();
    const { showModal, openModal, closeModal } = useModal();
    const commissionModal = useModal();
    const withdrawModal = useModal();
    const [availableCommission, setAvailableCommission] = useState<number>(0);
    const [isLoadingCommission, setIsLoadingCommission] = useState<boolean>(false);
    const [isCreatingCar, setIsCreatingCar] = useState<boolean>(false);
    const lastHashIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        // Prevenir ejecuciones duplicadas - solo ejecutar si hashId cambió realmente
        if (!selectedRole || selectedRole !== UserRole.ADMIN || !walletAddress || isLoadingCommission) {
            return;
        }

        // Prevenir ejecución duplicada si hashId no cambió
        if (hashId === lastHashIdRef.current) {
            return;
        }

        lastHashIdRef.current = hashId;
        setIsLoadingCommission(true);
        
        (async () => {
            try {
                const value = await stellarService.getAdminAvailableToWithdraw(walletAddress);
                setAvailableCommission(value);
            } catch (error) {
                console.error("Error fetching available commission:", error);
                setAvailableCommission(0);
            } finally {
                setIsLoadingCommission(false);
            }
        })();
    }, [selectedRole, walletAddress, hashId, isLoadingCommission]);


    const handleCreateCar = async (formData: CreateCar) => {
        // Prevenir ejecuciones duplicadas
        if (isCreatingCar) {
            return;
        }

        setIsCreatingCar(true);
        try {
            const { brand, model, color, passengers, pricePerDay, ac, ownerAddress } =
                formData;
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const addCarResult = await contractClient.add_car({
                owner: ownerAddress,
                price_per_day: pricePerDay * ONE_XLM_IN_STROOPS,
            });
            const xdr = addCarResult.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            const newCar: ICar = {
                brand,
                model,
                color,
                passengers,
                pricePerDay,
                ac,
                ownerAddress,
                status: CarStatus.AVAILABLE,
            };

            setCars((prevCars) => [...prevCars, newCar]);
            setHashId(txHash);
            toast.success("Vehículo agregado exitosamente.");
            closeModal();
        } catch (error) {
            console.error("Error creating car:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al agregar el vehículo. Por favor intenta de nuevo.";
            toast.error(errorMessage);
            // No cerrar el modal si hay error para que el usuario pueda intentar de nuevo
        } finally {
            setIsCreatingCar(false);
        }
    };



    const handleSetCommission = async (commission: number) => {
        try {
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const result = await contractClient.set_admin_commission({
                commission: commission * ONE_XLM_IN_STROOPS,
            });
            const xdr = result.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            setHashId(txHash);
            toast.success("Comisión configurada exitosamente.");
            
            // Refresh available commission after setting
            if (selectedRole === UserRole.ADMIN && walletAddress) {
                try {
                    const value = await stellarService.getAdminAvailableToWithdraw(walletAddress);
                    setAvailableCommission(value);
                } catch (error) {
                    console.error("Error refreshing available commission:", error);
                }
            }
            commissionModal.closeModal();
        } catch (error) {
            console.error("Error setting commission:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al configurar la comisión. Por favor intenta de nuevo.";
            toast.error(errorMessage);
            throw error; // Re-lanzar para que el modal pueda manejar el error
        }
    };

    const handleWithdrawCommission = async (amountInStroops: number) => {
        try {
            const contractClient =
                await stellarService.buildClient<IRentACarContract>(walletAddress);

            const result = await contractClient.withdraw_admin_commission({
                amount: amountInStroops,
            });
            const xdr = result.toXDR();

            const signedTx = await walletService.signTransaction(xdr);
            const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

            // Validar que la transacción fue exitosa antes de actualizar el estado
            if (!txHash) {
                throw new Error("La transacción no fue procesada correctamente.");
            }

            setHashId(txHash);
            toast.success("Comisión retirada exitosamente.");
            
            // Refresh available commission after withdrawal
            if (selectedRole === UserRole.ADMIN && walletAddress) {
                try {
                    const value = await stellarService.getAdminAvailableToWithdraw(walletAddress);
                    setAvailableCommission(value);
                } catch (error) {
                    console.error("Error refreshing available commission:", error);
                }
            }
            withdrawModal.closeModal();
        } catch (error) {
            console.error("Error withdrawing commission:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al retirar la comisión. Por favor intenta de nuevo.";
            toast.error(errorMessage);
            throw error; // Re-lanzar para que el modal pueda manejar el error
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold" data-test="dashboard-title">
                    Cars Catalog
                </h1>
                {selectedRole === UserRole.ADMIN && (
                    <div className="flex gap-3 items-center">
                        <div className="text-sm text-gray-600 mr-4">
                            Available Commission: {(availableCommission / ONE_XLM_IN_STROOPS).toFixed(7)} XLM
                        </div>
                        <button
                            onClick={commissionModal.openModal}
                            className="group px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">Set Commission</span>
                        </button>
                        <button
                            onClick={withdrawModal.openModal}
                            disabled={availableCommission <= 0}
                            className="group px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none cursor-pointer"
                        >
                            <span className="flex items-center gap-2">Withdraw Commission</span>
                        </button>
                        <button
                            onClick={openModal}
                            className="group px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none cursor-pointer"
                        >
                            <span className="flex items-center gap-2">Add Car</span>
                        </button>
                    </div>
                )}
            </div>

            {cars && <CarsList cars={cars} />}

            {showModal && (
                <CreateCarForm onCreateCar={handleCreateCar} onCancel={closeModal} />
            )}

            {commissionModal.showModal && (
                <SetCommissionModal
                    closeModal={commissionModal.closeModal}
                    onSetCommission={handleSetCommission}
                />
            )}

            {withdrawModal.showModal && (
                <WithdrawCommissionModal
                    closeModal={withdrawModal.closeModal}
                    onWithdraw={handleWithdrawCommission}
                    availableAmount={availableCommission}
                />
            )}

            {hashId && <StellarExpertLink url={hashId} />}
        </div>
    );
}