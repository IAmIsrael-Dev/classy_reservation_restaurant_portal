import React from 'react';
import { useDragLayer } from 'react-dnd';
import { Users } from 'lucide-react';

export function CustomDragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset || !item) {
    return null;
  }

  const { width, height, table } = item;

  const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  };

  const itemStyles: React.CSSProperties = {
    position: 'absolute',
    left: currentOffset.x,
    top: currentOffset.y,
    width: width,
    height: height,
    opacity: 0.8,
  };

  // Get colors based on status
  const statusColors = {
    available: {
      bgFrom: "#10b981",
      bgTo: "#059669",
      border: "rgba(52, 211, 153, 0.6)",
      text: "#ffffff",
    },
    reserved: {
      bgFrom: "#475569",
      bgTo: "#334155",
      border: "rgba(100, 116, 139, 0.6)",
      text: "#f1f5f9",
    },
    occupied: {
      bgFrom: "#f97316",
      bgTo: "#ea580c",
      border: "rgba(251, 146, 60, 0.6)",
      text: "#ffffff",
    },
    cleaning: {
      bgFrom: "#eab308",
      bgTo: "#ca8a04",
      border: "rgba(250, 204, 21, 0.6)",
      text: "#ffffff",
    },
  };

  const status = (table?.status || 'available') as keyof typeof statusColors;
  const colors = statusColors[status];

  const getShapeBorderRadius = (shape: string) => {
    switch (shape) {
      case "round":
      case "oval":
        return "50%";
      case "square":
        return "12px";
      case "rectangular":
        return "10px";
      default:
        return "12px";
    }
  };

  return (
    <div style={layerStyles}>
      <div style={itemStyles}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(to bottom right, ${colors.bgFrom}, ${colors.bgTo})`,
            border: `2px solid ${colors.border}`,
            borderRadius: getShapeBorderRadius(table?.shape || 'square'),
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.text,
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
            T{table?.number}
          </div>
          <div
            style={{
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Users style={{ width: '12px', height: '12px', opacity: 0.9 }} />
            <span style={{ fontSize: '10px', fontWeight: 600 }}>
              {table?.minCapacity}-{table?.maxCapacity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}