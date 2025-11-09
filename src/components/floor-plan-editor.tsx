import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Save,
  Edit2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid3x3,
  Users,
  X,
  Move,
  AlertCircle,
} from 'lucide-react';

// Types
type TableShape = 'circle' | 'square' | 'rectangle' | 'oval';
type TableStatus = 'available' | 'reserved' | 'occupied';

interface Position {
  x: number;
  y: number;
}

interface FloorTable {
  id: string;
  number: number;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  position: Position;
  rotation?: number;
  width?: number;
  height?: number;
}

interface TableTemplate {
  capacity: number;
  shape: TableShape;
  defaultWidth: number;
  defaultHeight: number;
}

interface FloorPlanEditorProps {
  tables: FloorTable[];
  onTablesChange: (tables: FloorTable[]) => void;
  width?: number;
  height?: number;
  editable?: boolean;
}

// Table templates with different capacities and shapes
const TABLE_TEMPLATES: TableTemplate[] = [
  // 2-person tables
  { capacity: 2, shape: 'circle', defaultWidth: 60, defaultHeight: 60 },
  { capacity: 2, shape: 'square', defaultWidth: 60, defaultHeight: 60 },
  { capacity: 2, shape: 'rectangle', defaultWidth: 80, defaultHeight: 50 },
  { capacity: 2, shape: 'oval', defaultWidth: 70, defaultHeight: 50 },
  
  // 4-person tables
  { capacity: 4, shape: 'circle', defaultWidth: 80, defaultHeight: 80 },
  { capacity: 4, shape: 'square', defaultWidth: 80, defaultHeight: 80 },
  { capacity: 4, shape: 'rectangle', defaultWidth: 100, defaultHeight: 60 },
  { capacity: 4, shape: 'oval', defaultWidth: 90, defaultHeight: 70 },
  
  // 5-person tables
  { capacity: 5, shape: 'circle', defaultWidth: 90, defaultHeight: 90 },
  { capacity: 5, shape: 'rectangle', defaultWidth: 110, defaultHeight: 70 },
  { capacity: 5, shape: 'oval', defaultWidth: 100, defaultHeight: 80 },
  
  // 6-person tables
  { capacity: 6, shape: 'circle', defaultWidth: 100, defaultHeight: 100 },
  { capacity: 6, shape: 'rectangle', defaultWidth: 130, defaultHeight: 80 },
  { capacity: 6, shape: 'oval', defaultWidth: 120, defaultHeight: 90 },
  
  // 8-person tables
  { capacity: 8, shape: 'circle', defaultWidth: 120, defaultHeight: 120 },
  { capacity: 8, shape: 'rectangle', defaultWidth: 160, defaultHeight: 90 },
  { capacity: 8, shape: 'oval', defaultWidth: 150, defaultHeight: 100 },
  
  // 10-person tables
  { capacity: 10, shape: 'rectangle', defaultWidth: 200, defaultHeight: 100 },
  { capacity: 10, shape: 'oval', defaultWidth: 180, defaultHeight: 110 },
  
  // 12+ person tables
  { capacity: 12, shape: 'rectangle', defaultWidth: 240, defaultHeight: 110 },
  { capacity: 12, shape: 'oval', defaultWidth: 220, defaultHeight: 120 },
];

// Draggable Table Component
interface DraggableTableProps {
  table: FloorTable;
  scale: number;
  isSelected: boolean;
  editable: boolean;
  onClick: () => void;
  onMove: (id: string, position: Position) => void;
  hasCollision?: boolean;
}

function DraggableTable({
  table,
  scale,
  isSelected,
  editable,
  onClick,
  hasCollision = false,
}: DraggableTableProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'table',
    item: { id: table.id, position: table.position },
    canDrag: editable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [table.id, table.position, editable]);

  const statusColors = {
    available: 'bg-green-500/20 border-green-500 text-green-400',
    reserved: 'bg-blue-500/20 border-blue-500 text-blue-400',
    occupied: 'bg-red-500/20 border-red-500 text-red-400',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    rectangle: 'rounded-lg',
    oval: 'rounded-full',
  };

  const width = (table.width || 80) * scale;
  const height = (table.height || 80) * scale;


  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        if (editable) {
          drag(node);
        }
      }}
      className={`absolute cursor-move transition-colors ${shapeClasses[table.shape]} ${
        hasCollision 
          ? 'bg-red-500/30 border-red-500 text-red-400' 
          : statusColors[table.status]
      } ${
        isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-xl z-10' : ''
      } ${isDragging ? 'opacity-40 cursor-grabbing' : ''} border-2 flex items-center justify-center hover:shadow-lg`}
      style={{
        left: `${table.position.x * scale}px`,
        top: `${table.position.y * scale}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${table.rotation || 0}deg)`,
      }}
      onClick={() => {
        if (!isDragging) {
          onClick();
        }
      }}
      title={hasCollision ? 'Warning: This table is overlapping with another table' : undefined}
    >
      <div className="flex flex-col items-center gap-0.5 pointer-events-none">
        <span className="text-xs opacity-75">T{table.number}</span>
        <Users className="w-3 h-3 opacity-75" />
        <span className="text-xs opacity-75">{table.capacity}</span>
      </div>
    </div>
  );
};

// Template Preview Component
interface TemplatePreviewProps {
  template: TableTemplate;
  onAdd: () => void;
}

function TemplatePreview({ template, onAdd }: TemplatePreviewProps) {
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    rectangle: 'rounded-lg',
    oval: 'rounded-full',
  };


  const shapeName = template.shape.charAt(0).toUpperCase() + template.shape.slice(1);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
      onClick={onAdd}
    >
      <div className="flex items-center gap-3">
        <div
          className={`${shapeClasses[template.shape]} bg-slate-600/50 border border-slate-500 flex items-center justify-center shrink-0`}
          style={{
            width: Math.min(template.defaultWidth * 0.5, 40),
            height: Math.min(template.defaultHeight * 0.5, 40),
          }}
        >
          <Users className="w-3 h-3 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-200">{template.capacity} Person</div>
          <div className="text-xs text-slate-400">{shapeName}</div>
        </div>
        <Plus className="w-4 h-4 text-blue-400" />
      </div>
    </motion.div>
  );
};

// Collision Detection Helper Functions
const checkCollision = (table1: FloorTable, table2: FloorTable): boolean => {
  const minGap = 3; // Minimum spacing between table edges (in pixels)
  
  // Get actual table dimensions
  const t1Width = table1.width || 80;
  const t1Height = table1.height || 80;
  const t2Width = table2.width || 80;
  const t2Height = table2.height || 80;
  
  // For both circular/oval shapes, use circle collision detection
  if ((table1.shape === 'circle' || table1.shape === 'oval') && 
      (table2.shape === 'circle' || table2.shape === 'oval')) {
    const t1CenterX = table1.position.x + t1Width / 2;
    const t1CenterY = table1.position.y + t1Height / 2;
    const t2CenterX = table2.position.x + t2Width / 2;
    const t2CenterY = table2.position.y + t2Height / 2;
    
    const t1Radius = Math.max(t1Width, t1Height) / 2;
    const t2Radius = Math.max(t2Width, t2Height) / 2;
    
    const distance = Math.sqrt(
      Math.pow(t2CenterX - t1CenterX, 2) + Math.pow(t2CenterY - t1CenterY, 2)
    );
    
    // Collision if distance is less than sum of radii plus minimum gap
    return distance < (t1Radius + t2Radius + minGap);
  }
  
  // For rectangular/square shapes or mixed shapes, use AABB collision
  const t1Left = table1.position.x;
  const t1Right = table1.position.x + t1Width;
  const t1Top = table1.position.y;
  const t1Bottom = table1.position.y + t1Height;
  
  const t2Left = table2.position.x;
  const t2Right = table2.position.x + t2Width;
  const t2Top = table2.position.y;
  const t2Bottom = table2.position.y + t2Height;
  
  // Tables are NOT colliding if they are completely separated on either axis
  // with at least minGap between them
  const separatedHorizontally = (t1Right + minGap <= t2Left) || (t2Right + minGap <= t1Left);
  const separatedVertically = (t1Bottom + minGap <= t2Top) || (t2Bottom + minGap <= t1Top);
  
  // If separated on either axis, no collision
  if (separatedHorizontally || separatedVertically) {
    return false;
  }
  
  // Otherwise, they are colliding
  return true;
};

const wouldCollide = (
  movingTable: FloorTable, 
  newPosition: Position, 
  allTables: FloorTable[]
): boolean => {
  const testTable = { ...movingTable, position: newPosition };
  
  return allTables.some(table => {
    if (table.id === movingTable.id) return false;
    return checkCollision(testTable, table);
  });
};

// Main Floor Plan Editor Component
export function FloorPlanEditor({
  tables: initialTables,
  onTablesChange,
  width = 800,
  height = 600,
  editable = true,
}: FloorPlanEditorProps) {
  const [tables, setTables] = useState<FloorTable[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [scale, setScale] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<FloorTable | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(() => ({
    accept: 'table',
    drop: (item: { id: string; position: Position }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const movingTable = tables.find(t => t.id === item.id);
        if (!movingTable) return;
        
        const tableWidth = movingTable.width || 80;
        const tableHeight = movingTable.height || 80;
        
        // Calculate new position (account for scale and center the table under cursor)
        let x = (offset.x - canvasRect.left) / scale - tableWidth / 2;
        let y = (offset.y - canvasRect.top) / scale - tableHeight / 2;
        
        // Clamp to canvas boundaries
        x = Math.max(0, Math.min(x, width - tableWidth));
        y = Math.max(0, Math.min(y, height - tableHeight));
        
        const newPosition = { x, y };
        
        // Check for collisions before moving
        if (wouldCollide(movingTable, newPosition, tables)) {
          toast.error('Cannot place table here - it would overlap with another table', {
            duration: 2000,
          });
          return;
        }
        
        handleMoveTable(item.id, newPosition);
      }
    },
  }), [scale, width, height, tables]);

  const handleMoveTable = (id: string, position: Position) => {
    const updatedTables = tables.map((t) =>
      t.id === id ? { ...t, position } : t
    );
    setTables(updatedTables);
    onTablesChange(updatedTables);
  };

  const handleAddTable = (template: TableTemplate) => {
    // Try to find a non-overlapping position
    let position = { x: width / 2 - template.defaultWidth / 2, y: height / 2 - template.defaultHeight / 2 };
    let attempts = 0;
    const maxAttempts = 50;
    
    const newTable: FloorTable = {
      id: `table-${Date.now()}-${Math.random()}`,
      number: tables.length + 1,
      capacity: template.capacity,
      shape: template.shape,
      status: 'available',
      position,
      rotation: 0,
      width: template.defaultWidth,
      height: template.defaultHeight,
    };
    
    // Try different positions in a spiral pattern to avoid overlaps
    while (wouldCollide(newTable, position, tables) && attempts < maxAttempts) {
      const angle = (attempts * 0.5) * Math.PI;
      const radius = 50 + (attempts * 15);
      position = {
        x: Math.max(0, Math.min(width / 2 + radius * Math.cos(angle) - template.defaultWidth / 2, width - template.defaultWidth)),
        y: Math.max(0, Math.min(height / 2 + radius * Math.sin(angle) - template.defaultHeight / 2, height - template.defaultHeight))
      };
      newTable.position = position;
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      toast.error('Could not find space for new table - please clear some space or zoom out');
      return;
    }
    
    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    onTablesChange(updatedTables);
    setSelectedTable(newTable);
    toast.success(`Added ${template.capacity}-person ${template.shape} table`);
  };

  const handleEditTable = (table: FloorTable) => {
    setEditingTable({ ...table });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTable) return;
    
    // Check if edited table would collide with others
    const otherTables = tables.filter(t => t.id !== editingTable.id);
    if (wouldCollide(editingTable, editingTable.position, otherTables)) {
      toast.error('Cannot save changes - table would overlap with another table');
      return;
    }
    
    const updatedTables = tables.map((t) =>
      t.id === editingTable.id ? editingTable : t
    );
    setTables(updatedTables);
    onTablesChange(updatedTables);
    setIsEditDialogOpen(false);
    setEditingTable(null);
    toast.success('Table updated');
  };

  const handleDeleteTable = (id: string) => {
    const updatedTables = tables.filter((t) => t.id !== id);
    setTables(updatedTables);
    onTablesChange(updatedTables);
    setSelectedTable(null);
    toast.success('Table deleted');
  };

  const handleRotateTable = (id: string) => {
    const updatedTables = tables.map((t) =>
      t.id === id ? { ...t, rotation: ((t.rotation || 0) + 45) % 360 } : t
    );
    setTables(updatedTables);
    onTablesChange(updatedTables);
  };

  const handleSaveFloorPlan = () => {
    onTablesChange(tables);
    toast.success('Floor plan saved successfully');
  };

  // Group templates by capacity
  const templatesByCapacity = TABLE_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.capacity]) {
      acc[template.capacity] = [];
    }
    acc[template.capacity].push(template);
    return acc;
  }, {} as Record<number, TableTemplate[]>);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Floor Plan Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-lg sm:text-xl text-slate-100 flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-blue-400" />
                Floor Plan Editor
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.max(0.3, scale - 0.1))}
                  className="border-slate-600 text-slate-300"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1.5 bg-slate-700 rounded-md text-sm text-slate-300 flex items-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.min(2, scale + 0.1))}
                  className="border-slate-600 text-slate-300"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFloorPlan}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div 
              ref={(node: HTMLDivElement | null) => {
                canvasRef.current = node;
                drop(node);
              }}
              className="relative bg-slate-900 rounded-lg border border-slate-700 overflow-auto"
              style={{ height: '500px' }}
            >
              <div
                className="relative mx-auto"
                style={{
                  width: `${width * scale}px`,
                  height: `${height * scale}px`,
                  backgroundImage: `
                    linear-gradient(to right, rgba(71, 85, 105, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(71, 85, 105, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * scale}px ${20 * scale}px`,
                }}
              >
                {tables.map((table) => {
                  // Check if this table collides with any other table
                  const otherTables = tables.filter(t => t.id !== table.id);
                  const hasCollision = otherTables.some(otherTable => checkCollision(table, otherTable));
                  
                  return (
                    <DraggableTable
                      key={table.id}
                      table={table}
                      scale={scale}
                      isSelected={selectedTable?.id === table.id}
                      editable={editable}
                      onClick={() => setSelectedTable(table)}
                      onMove={handleMoveTable}
                      hasCollision={hasCollision}
                    />
                  );
                })}
              </div>
            </div>

            {/* Collision Warning */}
            {tables.some((table, index) => 
              tables.slice(index + 1).some(otherTable => checkCollision(table, otherTable))
            ) && (
              <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Table Overlap Detected</p>
                  <p className="text-xs text-red-400/80 mt-1">
                    Some tables are overlapping. Please reposition them to avoid conflicts. Overlapping tables are highlighted in red.
                  </p>
                </div>
              </div>
            )}

            {/* Selected Table Actions */}
            <AnimatePresence>
              {selectedTable && editable && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="text-slate-200">
                      <span className="text-sm">Selected: </span>
                      <span className="font-medium">Table {selectedTable.number}</span>
                      <span className="text-sm text-slate-400 ml-2">
                        ({selectedTable.capacity} person, {selectedTable.shape})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotateTable(selectedTable.id)}
                        className="border-slate-600 text-slate-300"
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        Rotate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTable(selectedTable)}
                        className="border-slate-600 text-slate-300"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTable(selectedTable.id)}
                        className="border-red-600 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTable(null)}
                        className="border-slate-600 text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-xs text-green-400 mb-1">Available</div>
                <div className="text-lg sm:text-xl text-green-400">
                  {tables.filter((t) => t.status === 'available').length}
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xs text-blue-400 mb-1">Reserved</div>
                <div className="text-lg sm:text-xl text-blue-400">
                  {tables.filter((t) => t.status === 'reserved').length}
                </div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-xs text-red-400 mb-1">Occupied</div>
                <div className="text-lg sm:text-xl text-red-400">
                  {tables.filter((t) => t.status === 'occupied').length}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Table Templates Panel */}
        <div className="lg:col-span-1">
          <Card className="p-4 bg-slate-800 border-slate-700 h-full">
            <h3 className="text-lg text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Add Tables
            </h3>
            
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              <div className="space-y-4">
                {Object.entries(templatesByCapacity)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([capacity, templates]) => (
                    <div key={capacity}>
                      <h4 className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {capacity} Person Tables
                      </h4>
                      <div className="space-y-2 mb-4">
                        {templates.map((template, index) => (
                          <TemplatePreview
                            key={`${capacity}-${template.shape}-${index}`}
                            template={template}
                            onAdd={() => handleAddTable(template)}
                          />
                        ))}
                      </div>
                      {Number(capacity) !== 12 && <Separator className="bg-slate-700" />}
                    </div>
                  ))}
              </div>
            </ScrollArea>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-xs text-blue-400 space-y-1">
                <p className="flex items-center gap-2">
                  <Move className="w-3 h-3" />
                  Drag tables to reposition
                </p>
                <p className="flex items-center gap-2">
                  <RotateCw className="w-3 h-3" />
                  Click to select and rotate
                </p>
                <p className="flex items-center gap-2">
                  <Edit2 className="w-3 h-3" />
                  Edit capacity and shape
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle>Edit Table {editingTable?.number}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Customize table properties
            </DialogDescription>
          </DialogHeader>

          {editingTable && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-slate-300">Table Number</Label>
                <Input
                  type="number"
                  value={editingTable.number}
                  onChange={(e) =>
                    setEditingTable({ ...editingTable, number: parseInt(e.target.value) || 1 })
                  }
                  className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5"
                />
              </div>

              <div>
                <Label className="text-slate-300">Capacity (Guests)</Label>
                <Input
                  type="number"
                  value={editingTable.capacity}
                  onChange={(e) =>
                    setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) || 2 })
                  }
                  className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5"
                />
              </div>

              <div>
                <Label className="text-slate-300">Shape</Label>
                <Select
                  value={editingTable.shape}
                  onValueChange={(value) =>
                    setEditingTable({ ...editingTable, shape: value as TableShape })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="oval">Oval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Status</Label>
                <Select
                  value={editingTable.status}
                  onValueChange={(value) =>
                    setEditingTable({ ...editingTable, status: value as TableStatus })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Width (px)</Label>
                  <Input
                    type="number"
                    value={editingTable.width || 80}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, width: parseInt(e.target.value) || 80 })
                    }
                    className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Height (px)</Label>
                  <Input
                    type="number"
                    value={editingTable.height || 80}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, height: parseInt(e.target.value) || 80 })
                    }
                    className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Rotation (degrees)</Label>
                <Input
                  type="number"
                  value={editingTable.rotation || 0}
                  onChange={(e) =>
                    setEditingTable({ ...editingTable, rotation: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-700 border-slate-600 text-slate-100 mt-1.5"
                  min="0"
                  max="360"
                  step="15"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
};