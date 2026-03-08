import React from 'react';
import { motion } from 'framer-motion';
import { Star, Heart } from 'lucide-react';

interface RatingModalProps {
  role: 'rider' | 'driver';
  name: string;
  onSubmit: (rating: number, isFavorite?: boolean) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ role, name, onSubmit }) => {
  const [rating, setRating] = React.useState(0);
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm glass-panel rounded-3xl p-6 text-center"
      >
        <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
          {name[0]}
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1">
          Rate your {role === 'rider' ? 'driver' : 'rider'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">{name}</p>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-muted'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Favorite Driver - only show for riders */}
        {role === 'rider' && rating > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl mb-4 transition-all ${
              isFavorite
                ? 'bg-pink-500/10 border border-pink-500/30 text-pink-500'
                : 'bg-secondary text-muted-foreground border border-border'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-500' : ''}`} />
            <span className="text-sm font-semibold">
              {isFavorite ? 'Added to Favorites!' : 'Add to Favorite Drivers'}
            </span>
          </motion.button>
        )}

        <button
          onClick={() => rating > 0 && onSubmit(rating, isFavorite)}
          disabled={rating === 0}
          className="w-full py-3.5 rounded-xl brand-gradient text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          Submit Rating
        </button>
      </motion.div>
    </motion.div>
  );
};

export default RatingModal;
