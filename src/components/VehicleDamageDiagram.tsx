import React from 'react';
import './VehicleDamageDiagram.css';

export interface VehicleDamageDiagramProps {
  markedPoints: string[];
  onChange: (points: string[]) => void;
}

interface DamagePoint {
  key: string;
  label: string;
  cx: number;
  cy: number;
}

// Esquema simples do carro "de pé" (visto de cima), para-choque dianteiro no topo.
// viewBox 0 0 300 500. Exportado para ser reaproveitado pela versão somente-leitura
// usada no Laudo de Avarias impresso (ver ServiceOrderPrintView).
export const DAMAGE_POINTS: DamagePoint[] = [
  { key: 'front_bumper', label: 'Para-choque dianteiro', cx: 150, cy: 35 },
  { key: 'hood', label: 'Capô', cx: 150, cy: 90 },
  { key: 'windshield_front', label: 'Para-brisa', cx: 150, cy: 140 },
  { key: 'mirror_left', label: 'Retrovisor esquerdo', cx: 58, cy: 150 },
  { key: 'mirror_right', label: 'Retrovisor direito', cx: 242, cy: 150 },
  { key: 'wheel_front_left', label: 'Roda dianteira esquerda', cx: 28, cy: 178 },
  { key: 'wheel_front_right', label: 'Roda dianteira direita', cx: 272, cy: 178 },
  { key: 'door_front_left', label: 'Porta dianteira esquerda', cx: 70, cy: 215 },
  { key: 'door_front_right', label: 'Porta dianteira direita', cx: 230, cy: 215 },
  { key: 'roof', label: 'Teto', cx: 150, cy: 250 },
  { key: 'door_rear_left', label: 'Porta traseira esquerda', cx: 70, cy: 300 },
  { key: 'door_rear_right', label: 'Porta traseira direita', cx: 230, cy: 300 },
  { key: 'wheel_rear_left', label: 'Roda traseira esquerda', cx: 28, cy: 333 },
  { key: 'wheel_rear_right', label: 'Roda traseira direita', cx: 272, cy: 333 },
  { key: 'windshield_rear', label: 'Vidro traseiro', cx: 150, cy: 360 },
  { key: 'trunk', label: 'Porta-malas', cx: 150, cy: 410 },
  { key: 'rear_bumper', label: 'Para-choque traseiro', cx: 150, cy: 465 },
];

const VehicleDamageDiagram: React.FC<VehicleDamageDiagramProps> = ({ markedPoints, onChange }) => {
  const togglePoint = (key: string) => {
    if (markedPoints.includes(key)) {
      onChange(markedPoints.filter(p => p !== key));
    } else {
      onChange([...markedPoints, key]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGCircleElement>, key: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePoint(key);
    }
  };

  return (
    <div className="vehicle-damage-diagram">
      <svg
        viewBox="0 0 300 500"
        className="vehicle-damage-diagram-svg"
        role="img"
        aria-label="Diagrama do veículo para marcação de avarias"
      >
        {/* Carroceria (referência visual, não clicável) */}
        <rect x="75" y="45" width="150" height="425" rx="35" fill="#f8f9fa" stroke="#bdc3c7" strokeWidth="2" />
        <rect x="95" y="122" width="110" height="34" rx="6" fill="#eef2f5" stroke="#ccd3d8" />
        <rect x="95" y="344" width="110" height="34" rx="6" fill="#eef2f5" stroke="#ccd3d8" />
        <rect x="16" y="152" width="24" height="52" rx="6" fill="#34495e" />
        <rect x="260" y="152" width="24" height="52" rx="6" fill="#34495e" />
        <rect x="16" y="307" width="24" height="52" rx="6" fill="#34495e" />
        <rect x="260" y="307" width="24" height="52" rx="6" fill="#34495e" />

        {DAMAGE_POINTS.map(point => {
          const marked = markedPoints.includes(point.key);
          return (
            <circle
              key={point.key}
              cx={point.cx}
              cy={point.cy}
              r={12}
              className={`damage-point ${marked ? 'marked' : ''}`}
              tabIndex={0}
              role="button"
              aria-pressed={marked}
              aria-label={point.label}
              onClick={() => togglePoint(point.key)}
              onKeyDown={(e) => handleKeyDown(e, point.key)}
            >
              <title>{point.label}</title>
            </circle>
          );
        })}
      </svg>

      <div className="damage-legend">
        {DAMAGE_POINTS.map(point => (
          <label
            key={point.key}
            className={`damage-legend-item ${markedPoints.includes(point.key) ? 'marked' : ''}`}
          >
            <input
              type="checkbox"
              checked={markedPoints.includes(point.key)}
              onChange={() => togglePoint(point.key)}
            />
            <span>{point.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default VehicleDamageDiagram;
