import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface AttributeData {
  attribute: string;
  value: number;
  fullMark: number;
}

interface AttributeRadarChartProps {
  data: AttributeData[];
  color?: string;
  compareData?: AttributeData[];
  compareColor?: string;
  labels?: {
    primary?: string;
    compare?: string;
  };
}

export function AttributeRadarChart({ 
  data, 
  color = 'hsl(158, 64%, 45%)',
  compareData,
  compareColor = 'hsl(38, 92%, 50%)',
  labels
}: AttributeRadarChartProps) {
  // Merge data for comparison if provided
  const chartData = data.map((item, index) => ({
    ...item,
    compareValue: compareData?.[index]?.value,
  }));

  return (
    <div className="radar-container w-full h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid 
            stroke="hsl(220 15% 25%)" 
            strokeDasharray="3 3"
          />
          <PolarAngleAxis 
            dataKey="attribute" 
            tick={{ 
              fill: 'hsl(215 15% 55%)', 
              fontSize: 11,
              fontWeight: 500
            }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 20]} 
            tick={{ fill: 'hsl(215 15% 45%)', fontSize: 10 }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name={labels?.primary || 'Attributes'}
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {compareData && (
            <Radar
              name={labels?.compare || 'Compare'}
              dataKey="compareValue"
              stroke={compareColor}
              fill={compareColor}
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          {compareData && (
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
