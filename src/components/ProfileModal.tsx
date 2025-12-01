import { Button } from "./ui/button";
import { Input } from "./ui/input";


interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone: string;
    setPhone: (value: string) => void;
    address: string;
    setAddress: (value: string) => void;
    onSave: () => Promise<void>;
    saveLoading: boolean;
    error: string | null;
}



export const ProfileModal = ({
    isOpen,
    onClose,
    phone,
    setPhone,
    address,
    setAddress,
    onSave,
    saveLoading,
    error,
}: ProfileModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto">
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-2xl max-w-sm w-full mx-4 my-8">
                <div className="flex flex-col gap-4">
                    <h2 className="text-center text-xl font-bold">
                        Complete Your Profile 📦
                    </h2>
                    <p className="text-sm text-muted-foreground text-center">
                        Please provide your phone and address to proceed to sell your product.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone Number (e.g., +1234567890)"
                            required
                        />
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Shipping Address"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <Button
                        onClick={onSave}
                        disabled={saveLoading || !phone.trim() || !address.trim()}
                        className="w-full"
                    >
                        {saveLoading ? "Saving..." : "Save and Continue"}
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
