import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';

/**
 * Sample usage:
 *
 * <div className="w-full max-w-md aspect-square">
 *   <ReviewChart
 *     sides={6}
 *     layers={3}
 *     ratings={{
 *       Story: 4,
 *       Music: 1,
 *       Graphics: 4,
 *       Gameplay: 3,
 *       Longevity: 2,
 *       Innovation: 1,
 *     }}
 *     maxRating={4}
 *     className="my-4"
 *   />
 * </div>
 */

// Information about a hovered polygon segment
interface SegmentInfo {
  layer: number;
  seg: number;
  filled: boolean;
  rating?: number;
  label?: string;
}

interface ReviewChartProps {
  // Optional className for container styling
  className?: string;

  // Data
  ratings: Record<string, number>; // Ratings object with category names as keys and rating values
  maxRating?: number; // Maximum possible rating value (default: 4)

  // Sizing and structure
  sides?: number; // Number of polygon sides (default: based on ratings keys)
  layers?: number; // Number of layers in the polygon (default: 3)

  // Interaction
  getCalloutContent?: (info: SegmentInfo) => React.ReactNode;
}

function getPolygonVertex(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): [number, number] {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

// Consider moving pure SVG helpers like getPolygonVertex to a util file.

const CenterSegments = ({
  cx,
  cy,
  radius,
  sides,
  segmentColors,
  gapAngle = 0,
  gapRadius = 0,
  onHover,
  onHoverPosition,
  filled,
  emptyOpacity,
}: {
  cx: number;
  cy: number;
  radius: number;
  sides: number;
  segmentColors: string[];
  gapAngle?: number;
  gapRadius?: number;
  onHover?: (idx: number | null) => void;
  onHoverPosition?: (pos: { x: number; y: number }) => void;
  filled: boolean[];
  emptyOpacity?: number;
}) => {
  const angleStep = (2 * Math.PI) / sides;
  const segments = [];
  const effectiveRadius = Math.max(radius + gapRadius, 0);
  for (let i = 0; i < sides; i++) {
    const angleStart = -Math.PI / 2 + i * angleStep + gapAngle / 2;
    const angleEnd = -Math.PI / 2 + (i + 1) * angleStep - gapAngle / 2;
    const v0 = getPolygonVertex(cx, cy, effectiveRadius, angleStart);
    const v1 = getPolygonVertex(cx, cy, effectiveRadius, angleEnd);
    const midAngle = (angleStart + angleEnd) / 2;
    const midR = effectiveRadius * 0.7;
    const calloutX = cx + midR * Math.cos(midAngle);
    const calloutY = cy + midR * Math.sin(midAngle);

    const isActive = filled[i];

    segments.push(
      <motion.polygon
        key={`center-segment-${i}`}
        points={[`${v0[0]},${v0[1]}`, `${v1[0]},${v1[1]}`, `${cx},${cy}`].join(
          ' ',
        )}
        fill={isActive ? segmentColors[0] : 'var(--empty-color)'}
        fillOpacity={isActive ? 1 : (emptyOpacity ?? 0.3)}
        stroke="#23272f"
        strokeWidth={4.5}
        className="cursor-pointer"
        whileHover={
          isActive
            ? {
                scale: 1.11,
                zIndex: 99,
              }
            : { scale: 1 }
        }
        onMouseEnter={() => {
          if (onHover) onHover(i);
          if (onHoverPosition) onHoverPosition({ x: calloutX, y: calloutY });
        }}
        onMouseMove={() => {
          if (onHoverPosition) onHoverPosition({ x: calloutX, y: calloutY });
        }}
        onMouseLeave={() => {
          if (onHover) onHover(null);
          if (onHoverPosition) onHoverPosition({ x: 0, y: 0 });
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      />,
    );
  }
  return <>{segments}</>;
};

export const ReviewChart: React.FC<ReviewChartProps> = ({
  layers = 3,
  sides: propSides,
  ratings,
  maxRating = 4,
  getCalloutContent,
  className,
}) => {
  // Container ref for responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(0);
  // Fixed styling and geometry values
  const emptyOpacity = 0.25;
  const gapAngle = 0;
  const gapRadius = 2;
  const currentLevel = 0; // Default level for legacy support

  // Memoize colors to prevent unnecessary re-renders
  const colors = useMemo(
    () => [
      Array(6).fill('var(--second-layer-color)'),
      Array(6).fill('var(--third-layer-color)'),
      Array(6).fill('var(--fourth-layer-color)'),
    ],
    [],
  );

  // Effect for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    // Initial size calculation
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Use the smaller dimension to ensure the chart fits
        setContainerSize(Math.min(width, height));
      }
    };

    // Set initial size
    updateSize();

    // Set up ResizeObserver for responsive behavior
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    if (containerRef.current) {
      resizeObserver.unobserve(containerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Memoize radius calculations to prevent unnecessary recalculations
  const { cx, cy, layerRadii } = useMemo(() => {
    // Use containerSize for calculations
    const size = containerSize || 300; // Default fallback size
    const cx = size / 2;
    const cy = size / 2;
    const minRadius = size * 0.12;
    const maxRadius = size * 0.39;
    const availableRadius = maxRadius - minRadius - (layers + 1) * gapRadius;
    const layerThickness = availableRadius / layers;
    const layerRadii = Array.from(
      { length: layers + 1 },
      (_, idx) => minRadius + idx * (layerThickness + gapRadius),
    );

    return { cx, cy, layerRadii };
  }, [containerSize, layers, gapRadius]);

  const [hovered, setHovered] = useState<{ layer: number; seg: number } | null>(
    null,
  );
  const [calloutPos, setCalloutPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Memoize ratings-related calculations
  const { effectiveLabels, ratingValues, sides } = useMemo(() => {
    const effectiveLabels: string[] = Object.keys(ratings);
    const ratingValues: number[] = effectiveLabels.map(
      (label) => ratings[label] || 0,
    );
    const sides = propSides || effectiveLabels.length;

    return { effectiveLabels, ratingValues, sides };
  }, [ratings, propSides]);

  // Calculate angle step once
  const angleStep = (2 * Math.PI) / sides;

  // Memoize polygon segments generation
  const sectionPolygons = useMemo(() => {
    const polygons = [];

    for (let layerIdx = 0; layerIdx < layers; layerIdx++) {
      const innerRadius = layerRadii[layerIdx] + gapRadius / 2;
      const outerRadius = layerRadii[layerIdx + 1] - gapRadius / 2;

      // Layer threshold (1-indexed): layer 0 = rating 1, layer 1 = rating 2, etc.
      // Determine if segment should be active based on its rating

      for (let segIdx = 0; segIdx < sides; segIdx++) {
        const angleStart = -Math.PI / 2 + segIdx * angleStep + gapAngle / 2;
        const angleEnd = -Math.PI / 2 + (segIdx + 1) * angleStep - gapAngle / 2;
        const innerA = getPolygonVertex(cx, cy, innerRadius, angleStart);
        const innerB = getPolygonVertex(cx, cy, innerRadius, angleEnd);
        const outerA = getPolygonVertex(cx, cy, outerRadius, angleStart);
        const outerB = getPolygonVertex(cx, cy, outerRadius, angleEnd);

        const midAngle = (angleStart + angleEnd) / 2;
        const midR = (innerRadius + outerRadius) / 2;
        const calloutX = cx + midR * Math.cos(midAngle);
        const calloutY = cy + midR * Math.sin(midAngle);

        // Determine if this segment should be filled
        let isActive = false;

        if (ratings && ratingValues.length > 0) {
          const segmentRating = ratingValues[segIdx] || 0;
          isActive = segmentRating >= layerIdx + 2;
        } else {
          // Legacy fill: all segments in layers < currentLevel are filled
          isActive = layerIdx < currentLevel;
        }

        const isHover = hovered?.layer === layerIdx && hovered?.seg === segIdx;

        // Create a closure for event handlers to capture current segment values
        const handleMouseEnter = () => {
          setHovered({ layer: layerIdx, seg: segIdx });
          setCalloutPos({ x: calloutX, y: calloutY });
        };

        const handleMouseMove = () => {
          setCalloutPos({ x: calloutX, y: calloutY });
        };

        polygons.push(
          <motion.path
            key={`layer${layerIdx}-segment${segIdx}`}
            d={[
              `M ${innerA[0]},${innerA[1]}`,
              `L ${outerA[0]},${outerA[1]}`,
              `L ${outerB[0]},${outerB[1]}`,
              `L ${innerB[0]},${innerB[1]}`,
              'Z',
            ].join(' ')}
            fill={
              isActive ? colors[layerIdx]?.[0] || '#aaa' : 'var(--empty-color)'
            }
            fillOpacity={isActive ? 1 : emptyOpacity}
            stroke="#23272f"
            strokeWidth={4.5}
            style={{ cursor: 'pointer' }}
            whileHover={
              isActive
                ? {
                    scale: isHover ? 1.07 : 1,
                    zIndex: isHover ? 99 : 1,
                  }
                : { scale: 1 }
            }
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          />,
        );
      }
    }

    return polygons;
  }, [
    cx,
    cy,
    layers,
    sides,
    layerRadii,
    gapRadius,
    gapAngle,
    colors,
    ratingValues,
    currentLevel,
    emptyOpacity,
    hovered,
    angleStep,
    ratings,
  ]);

  // Memoize center segments calculation
  const centerFilled = useMemo(() => {
    const filled: boolean[] = [];

    // Fill center segments based on ratings or currentLevel
    if (ratings && ratingValues.length > 0) {
      // For ratings mode: center is filled if rating is at least 1
      for (let i = 0; i < sides; i++) {
        // A rating of 0 means nothing is filled, 1+ means center is filled
        filled.push(ratingValues[i] >= 1);
      }
    } else {
      // Legacy mode: all center segments filled if currentLevel >= 1
      for (let i = 0; i < sides; i++) {
        filled.push(currentLevel >= 1);
      }
    }

    return filled;
  }, [sides, ratings, ratingValues, currentLevel]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square h-full w-full rounded-3xl shadow-2xl ${className || ''}`}
      style={{
        background:
          'radial-gradient(ellipse at 52% 58%, #232e3b 70%, #11161b 100%)',
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="relative z-10"
        viewBox={`0 0 ${containerSize} ${containerSize}`}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="8"
              floodColor="#000"
              floodOpacity="0.28"
            />
          </filter>
        </defs>
        {sectionPolygons}
        {/* Center triangles (top "pyramid" layer) */}
        <CenterSegments
          cx={cx}
          cy={cy}
          radius={layerRadii[0]}
          sides={sides}
          segmentColors={Array(6).fill('var(--center-layer-color)')}
          gapAngle={gapAngle}
          gapRadius={gapRadius / 2}
          filled={centerFilled}
          emptyOpacity={emptyOpacity}
          onHover={useCallback(
            (idx: number | null) => {
              if (idx !== null) {
                setHovered({ layer: -1, seg: idx });
                const angleStep = (2 * Math.PI) / sides;
                const angleStart =
                  -Math.PI / 2 + idx * angleStep + gapAngle / 2;
                const angleEnd =
                  -Math.PI / 2 + ((idx + 1) % sides) * angleStep - gapAngle / 2;
                const midAngle = (angleStart + angleEnd) / 2;
                const midR = layerRadii[0] * 0.8;
                setCalloutPos({
                  x: cx + midR * Math.cos(midAngle),
                  y: cy + midR * Math.sin(midAngle),
                });
              } else {
                setHovered(null);
              }
            },
            [cx, cy, sides, gapAngle, layerRadii],
          )}
          // No need for activeIdx as we handle active state differently
          onHoverPosition={undefined}
        />
        {/* Draw labels under each side with tooltips */}
        {useMemo(() => {
          if (effectiveLabels.length !== sides) return null;

          return Array.from({ length: sides }).map((_, segIdx) => {
            const angle = -Math.PI / 2 + segIdx * angleStep + angleStep / 2;
            const labelRadius = layerRadii[layerRadii.length - 1] + 26; // adjust offset as needed
            const x = Math.round(cx + labelRadius * Math.cos(angle));
            const y = Math.round(cy + labelRadius * Math.sin(angle) + 4);

            // Get rating if available
            const rating = ratingValues[segIdx];
            const hasRating = ratings && rating !== undefined;
            const label = effectiveLabels[segIdx];

            // Determine rating color based on the rating value and matching segment colors
            let ratingColor;
            if (rating >= 4) {
              ratingColor = 'var(--fourth-layer-color)'; // Fourth layer color (green)
            } else if (rating >= 3) {
              ratingColor = 'var(--third-layer-color)'; // Third layer color (gold)
            } else if (rating >= 2) {
              ratingColor = 'var(--second-layer-color)'; // Second layer color (orange-brown)
            } else {
              ratingColor = 'var(--center-layer-color)'; // First/center layer color (red)
            }

            return (
              <foreignObject
                key={`label-${segIdx}`}
                x={x - 60}
                y={y}
                width={120}
                height={60}
                className="overflow-visible"
              >
                <div className="flex flex-col items-center font-medium tracking-wider text-white drop-shadow-md">
                  <div className="text-base">{label}</div>
                  {hasRating && (
                    <div
                      className="mt-2 text-lg font-bold drop-shadow-lg"
                      style={{
                        color: ratingColor,
                      }}
                    >
                      {rating}/{maxRating}
                    </div>
                  )}
                </div>
              </foreignObject>
            );
          });
        }, [
          effectiveLabels,
          sides,
          angleStep,
          layerRadii,
          cx,
          cy,
          ratingValues,
          ratings,
          maxRating,
        ])}
      </svg>
      {/* Callout */}
      {useMemo(() => {
        if (!hovered) return null;

        // Calculate callout content only when hovered is defined
        const segmentInfo: SegmentInfo = {
          layer: hovered.layer,
          seg: hovered.seg,
          filled:
            hovered.layer === -1
              ? centerFilled[hovered.seg]
              : ratings && ratingValues.length > 0
                ? ratingValues[hovered.seg] >= hovered.layer + 2
                : hovered.layer < currentLevel,
          rating: ratingValues[hovered.seg],
          label: effectiveLabels[hovered.seg],
        };

        const calloutContent = getCalloutContent
          ? getCalloutContent(segmentInfo)
          : (() => {
              const segLabel =
                effectiveLabels[hovered.seg] || `Section ${hovered.seg + 1}`;
              const segRating = ratingValues[hovered.seg];
              const hasRating = ratings && segRating !== undefined;

              if (hovered.layer === -1) {
                return hasRating ? (
                  <>
                    {segLabel}: {segRating}/{maxRating}
                  </>
                ) : (
                  <>
                    Center {segLabel}{' '}
                    {centerFilled[hovered.seg] ? '(filled)' : '(empty)'};
                  </>
                );
              } else {
                const layerValue = hovered.layer + 1;
                const isFilled = hasRating
                  ? segRating >= layerValue
                  : hovered.layer < currentLevel;

                return hasRating ? (
                  <>
                    {segLabel}: {segRating}/{maxRating} {isFilled ? '✓' : '✗'}{' '}
                    Level {layerValue}
                  </>
                ) : (
                  <>
                    Layer {layerValue}, {segLabel}{' '}
                    {isFilled ? 'FILLED' : 'EMPTY'}
                  </>
                );
              }
            })();

        return (
          <div
            className="bg-opacity-95 pointer-events-none absolute z-50 w-max max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-[120%] rounded-lg bg-[#1c202e] px-5 py-2.5 text-sm font-medium text-white shadow-lg"
            style={{
              left: calloutPos.x,
              top: calloutPos.y,
            }}
          >
            {calloutContent}
          </div>
        );
      }, [
        hovered,
        calloutPos,
        getCalloutContent,
        centerFilled,
        ratings,
        ratingValues,
        currentLevel,
        effectiveLabels,
        maxRating,
      ])}
    </div>
  );
};

export default ReviewChart;
