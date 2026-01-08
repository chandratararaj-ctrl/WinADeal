import { useState, useEffect } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (code: string) => void;
    isLoading?: boolean;
}

export default function VerificationModal({ isOpen, onClose, onSubmit, isLoading }: Props) {
    const [code, setCode] = useState('');

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Delivery</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Ask the customer for the 6-digit verification code sent to their app.
                    </p>

                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all mb-4"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSubmit(code)}
                            disabled={isLoading || code.length < 4}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
