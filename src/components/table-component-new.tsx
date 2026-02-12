import React from 'react';
import { useDrag } from 'react-dnd';
import { Users } from 'lucide-react';

type TableShape = "round" | "square" | "rectangular" | "oval";

type TableStatus = "available" | "reserved" | "occupied" | "cleaning";

interface Position {
  x: number;
  y: number;
}

interface FloorTable {
  id: string;
  number: number;
  floorId: string;
  minCapacity: number;
  maxCapacity: number;
  shape: TableShape;
  status: TableStatus;
  position: Position;
  rotation?: number;
  scale?: number;
  reservationId?: string;
}

interface TableComponentProps {
  table: FloorTable;
  onClick: () => void;
  selectedId?: string;
  isEditMode?: boolean;
}

function TableComponentNewBase({
  table,
  onClick,
  selectedId,
  isEditMode = false,
}: TableComponentProps) {
  // Calculate size BEFORE useDrag
  const sizeMap = {
    2: { width: 70, height: 70 },
    4: { width: 90, height: 90 },
    6: { width: 130, height: 90 },
    8: { width: 150, height: 100 },
  };

  const shapeMultipliers: Record<TableShape, { width: number; height: number }> = {
    round: { width: 1, height: 1 },
    square: { width: 1, height: 1 },
    rectangular: { width: 1.5, height: 0.8 },
    oval: { width: 1.3, height: 0.9 },
  };

  let size = sizeMap[table.maxCapacity as keyof typeof sizeMap] || sizeMap[4];
  const multiplier = shapeMultipliers[table.shape] || { width: 1, height: 1 };
  
  size = {
    width: size.width * multiplier.width,
    height: size.height * multiplier.height,
  };

  const tableScale = table.scale || 1.0;
  size = {
    width: size.width * tableScale,
    height: size.height * tableScale,
  };

  // NOW we can use useDrag with size
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "table",
      item: {
        id: table.id,
        width: size.width,
        height: size.height,
        table: table, // Pass full table data for drag layer
      },
      canDrag: isEditMode, // Allow dragging in edit mode
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [table.id, size.width, size.height, table, isEditMode],
  );

  // All colors as inline styles
  const statusColors = {
    available: {
      bgFrom: "#10b981",
      bgTo: "#059669",
      border: "rgba(52, 211, 153, 0.6)",
      shadow: "0 10px 15px -3px rgba(6, 78, 59, 0.3)",
      text: "#ffffff",
      indicator: "#6ee7b7",
      indicatorRing: "rgba(52, 211, 153, 0.4)",
    },
    reserved: {
      bgFrom: "#475569",
      bgTo: "#334155",
      border: "rgba(100, 116, 139, 0.6)",
      shadow: "0 10px 15px -3px rgba(15, 23, 42, 0.4)",
      text: "#f1f5f9",
      indicator: "#60a5fa",
      indicatorRing: "rgba(96, 165, 250, 0.4)",
    },
    occupied: {
      bgFrom: "#f97316",
      bgTo: "#ea580c",
      border: "rgba(251, 146, 60, 0.6)",
      shadow: "0 10px 15px -3px rgba(124, 45, 18, 0.3)",
      text: "#ffffff",
      indicator: "#fdba74",
      indicatorRing: "rgba(251, 146, 60, 0.4)",
    },
    cleaning: {
      bgFrom: "#eab308",
      bgTo: "#ca8a04",
      border: "rgba(250, 204, 21, 0.6)",
      shadow: "0 10px 15px -3px rgba(113, 63, 18, 0.3)",
      text: "#ffffff",
      indicator: "#fde047",
      indicatorRing: "rgba(250, 204, 21, 0.4)",
    },
  };

  // Simple shape styles - only basic shapes
  const getShapeStyles = () => {
    switch (table.shape) {
      case "round":
        return { borderRadius: "50%" };
      
      case "square":
        return { borderRadius: "12px" };
      
      case "rectangular":
        return { borderRadius: "10px" };
      
      case "oval":
        return { borderRadius: "50%" };
      
      default:
        return { borderRadius: "12px" };
    }
  };

  const isSelected = selectedId === table.id;
  const colors = statusColors[table.status];
  const shapeStyles = getShapeStyles();
  const userRotation = table.rotation || 0;

  // Container styles - ALL INLINE
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: table.position.x,
    top: table.position.y,
    width: size.width,
    height: size.height,
    cursor: isEditMode ? (isDragging ? "grabbing" : "grab") : "pointer",
    opacity: 1,
    zIndex: isSelected ? 50 : 10,
    transform: `rotate(${userRotation}deg) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
    transformOrigin: "center center",
    boxShadow: colors.shadow,
    transition: "none",
  };

  // Shape background - ALL INLINE
  const shapeStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(to bottom right, ${colors.bgFrom}, ${colors.bgTo})`,
    border: `2px solid ${colors.border}`,
    borderRadius: shapeStyles.borderRadius,
    transition: "none",
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    color: colors.text,
  };

  const indicatorStyle: React.CSSProperties = {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: colors.indicator,
    boxShadow: `0 0 0 2px ${colors.indicatorRing}`,
  };

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        if (isEditMode && node) {
          drag(node);
        }
      }}
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isDragging && !isEditMode) {
          e.currentTarget.style.transform = `rotate(${userRotation}deg) scale(${isSelected ? 1.1 : 1.05}) translateY(-2px)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !isEditMode) {
          e.currentTarget.style.transform = `rotate(${userRotation}deg) scale(${isSelected ? 1.1 : 1})`;
        }
      }}
    >
      {/* Shape Background */}
      <div style={shapeStyle} />

      {/* Content */}
      <div style={contentStyle}>
        <div style={{ position: "relative", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Table Number */}
          <div style={{ 
            fontSize: "16px", 
            fontWeight: "bold", 
            letterSpacing: "-0.025em",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          }}>
            T{table.number}
          </div>

          {/* Capacity Badge */}
          <div style={{
            marginTop: "4px",
            padding: "2px 8px",
            borderRadius: "9999px",
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <Users style={{ width: "12px", height: "12px", opacity: 0.9 }} />
            <span style={{ fontSize: "10px", fontWeight: 600 }}>{table.minCapacity}-{table.maxCapacity}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div style={indicatorStyle} />
      </div>

      {/* Selected ring */}
      {isSelected && (
        <div style={{
          position: "absolute",
          top: "-4px",
          left: "-4px",
          right: "-4px",
          bottom: "-4px",
          borderRadius: "inherit",
          border: "4px solid rgba(96, 165, 250, 0.6)",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
};

// Export directly without memo for now
export const TableComponentNew = TableComponentNewBase;

// Export as both names for compatibility
export const TableComponentOptimized = TableComponentNew;