'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateAddressAction } from '@/app/actions/updateAddress';
import { deleteAddressAction } from '@/app/actions/deleteAddress';

interface AddressEditFormProps {
  id: string;
  initialLabel: string;
  initialFloor: string;
  initialUnit: string;
  initialLandmark: string;
}

export default function AddressEditForm({
  id,
  initialLabel,
  initialFloor,
  initialUnit,
  initialLandmark,
}: AddressEditFormProps) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
  const [floor, setFloor] = useState(initialFloor);
  const [unit, setUnit] = useState(initialUnit);
  const [landmark, setLandmark] = useState(initialLandmark);

  const isUpdatingRef = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isDeletingRef = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission
    if (
      isUpdating ||
      isUpdatingRef.current ||
      isDeleting ||
      isDeletingRef.current
    )
      return;

    isUpdatingRef.current = true;
    setIsUpdating(true);

    try {
      const result = await updateAddressAction({
        slugOrId: id,
        label: label.trim(),
        floor: floor.trim(),
        flat: unit.trim(),
        landmark: landmark.trim(),
      });

      if (result.success) {
        toast.success('Address updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update address.');
      }
    } catch (err) {
      console.error('[AddressEditForm] Update error:', err);
      toast.error('Network error while saving changes.');
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission
    if (
      isDeleting ||
      isDeletingRef.current ||
      isUpdating ||
      isUpdatingRef.current
    )
      return;

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this micro-address? This action cannot be undone.'
    );
    if (!confirmed) return;

    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      const result = await deleteAddressAction(id);
      if (result.success) {
        toast.success('Address deleted successfully.');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to delete address.');
        isDeletingRef.current = false;
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('[AddressEditForm] Delete error:', err);
      toast.error('Network error while deleting address.');
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 font-sans">
      {/* Factor 4: Secondary Metadata (Floor, Unit, Landmark) */}
      <div className="bg-card border-border space-y-4 rounded border p-4">
        <div className="text-muted-foreground font-sans text-xs font-semibold tracking-wider uppercase">
          Z-Axis & Building Metadata
        </div>

        <div>
          <label
            htmlFor="address-label"
            className="text-foreground mb-1.5 block font-sans text-xs font-medium"
          >
            Address Label
          </label>
          <input
            id="address-label"
            type="text"
            disabled={isUpdating || isDeleting}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="floor"
              className="text-foreground mb-1.5 block font-sans text-xs font-medium"
            >
              Floor / Level
            </label>
            <input
              id="floor"
              type="text"
              disabled={isUpdating || isDeleting}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="unit"
              className="text-foreground mb-1.5 block font-sans text-xs font-medium"
            >
              Flat / Unit No.
            </label>
            <input
              id="unit"
              type="text"
              disabled={isUpdating || isDeleting}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="landmark"
            className="text-foreground mb-1.5 block font-sans text-xs font-medium"
          >
            Visual Landmark
          </label>
          <input
            id="landmark"
            type="text"
            disabled={isUpdating || isDeleting}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className="bg-background border-input text-foreground focus:ring-accent disabled:bg-muted w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Action Buttons: Update & Delete */}
      <div className="space-y-3 pt-2 font-sans">
        <button
          type="submit"
          id="save-address-btn"
          disabled={isUpdating || isDeleting}
          className="bg-accent text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded text-sm font-semibold shadow-xs transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          {isUpdating ? (
            <>
              <Loader2 className="text-accent-foreground h-4 w-4 animate-spin" />
              <span>Saving changes...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="delete-address-btn"
          onClick={handleDelete}
          disabled={isUpdating || isDeleting}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded border font-sans text-xs font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              <span>Delete Micro-Address</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
