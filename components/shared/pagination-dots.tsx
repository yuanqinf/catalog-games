import { CarouselApi } from '@/components/ui/carousel';

interface PaginationDotsProps {
  totalItems: number;
  activeIndex: number;
  carouselApi: CarouselApi | null;
  className?: string;
}

const PaginationDots = ({
  totalItems,
  activeIndex,
  carouselApi,
  className = '',
}: PaginationDotsProps) => {
  return (
    <div className={`mt-4 flex justify-center gap-2 ${className}`}>
      {Array.from({ length: totalItems }).map((_, index) => (
        <button
          key={`dot-${index}`}
          className={`pagination-dot ${
            activeIndex === index
              ? 'pagination-dot-active'
              : 'pagination-dot-inactive'
          }`}
          onClick={() => {
            carouselApi?.scrollTo(index);
          }}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default PaginationDots;
