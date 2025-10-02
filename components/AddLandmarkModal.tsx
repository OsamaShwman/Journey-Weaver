
import React, { useState, useEffect } from 'react';
import type { Landmark } from '../types';

interface AddLandmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (landmarkData: Omit<Landmark, 'id' | 'coords'>) => void;
}

const AddLandmarkModal: React.FC<AddLandmarkModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [iconType, setIconType] = useState<Landmark['iconType']>('monument');

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setName('');
      setDescription('');
      setImageUrl('');
      setVideoUrl('');
      setAudioUrl('');
      setIconType('monument');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      alert('Please fill out the name and description.');
      return;
    }
    onSave({
      name,
      title: name.toUpperCase(),
      description,
      imageUrl: imageUrl.trim() || `https://picsum.photos/seed/${Date.now()}/1200/800`, // Default image
      videoUrl: videoUrl.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
      iconType,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg p-6 m-4 bg-gray-900 border border-white/10 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white">Add a New Landmark</h2>
        <p className="mt-1 text-sm text-gray-400">
          You've chosen a spot on the map. Now, tell us about it.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-sm text-white/90 transition-all bg-black/30 border border-white/10 rounded-md placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="e.g., My Favorite Restaurant"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-sm text-white/90 transition-all bg-black/30 border border-white/10 rounded-md placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="A short description of the landmark."
            />
          </div>
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300">Image URL (Optional)</label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-sm text-white/90 transition-all bg-black/30 border border-white/10 rounded-md placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300">Video URL (Optional)</label>
            <input
              type="text"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-sm text-white/90 transition-all bg-black/30 border border-white/10 rounded-md placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="e.g., YouTube or direct video link"
            />
          </div>
          <div>
            <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-300">Audio URL (Optional)</label>
            <input
              type="text"
              id="audioUrl"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-sm text-white/90 transition-all bg-black/30 border border-white/10 rounded-md placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="e.g., SoundCloud or direct audio link"
            />
          </div>
          <div>
            <label htmlFor="iconType" className="block text-sm font-medium text-gray-300">Icon Type</label>
            <select
              id="iconType"
              value={iconType}
              onChange={(e) => setIconType(e.target.value as Landmark['iconType'])}
              className="w-full px-3 py-2 mt-1 text-sm text-white/90 transition-all bg-black/30 border border-white/10 rounded-md focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            >
              <option value="monument">Monument</option>
              <option value="nature">Nature</option>
              <option value="water">Water</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-300 transition-colors bg-black/30 rounded-md hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-gray-900 transition-colors bg-yellow-500 rounded-md hover:bg-yellow-400"
          >
            Save Landmark
          </button>
        </div>
      </div>
       <style>{`
            @keyframes fade-in-fast {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            .animate-fade-in-fast {
                animation: fade-in-fast 0.2s ease-in-out;
            }
        `}</style>
    </div>
  );
};

export default AddLandmarkModal;