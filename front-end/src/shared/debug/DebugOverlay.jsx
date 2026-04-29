import { useEffect, useState } from 'react'
import C from '../../styles/colors.js'

export default function DebugOverlay({ metrics = {} }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      width: expanded ? 400 : 200,
      background: 'rgba(0, 0, 0, 0.9)', 
      color: 'white', 
      borderRadius: 8, 
      padding: 12, 
      fontSize: 11,
      fontFamily: 'monospace',
      zIndex: 1000,
      border: '1px solid #333',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8,
        cursor: 'pointer'
      }} onClick={() => setExpanded(!expanded)}>
        <strong>Engine Telemetry</strong>
        <span style={{ fontSize: 10 }}>{expanded ? '−' : '+'}</span>
      </div>
      
      {Object.entries(metrics).map(([name, data]) => (
        <div key={name} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #333' }}>
          <div style={{ color: '#4CAF50', fontSize: 10, marginBottom: 4 }}>
            {name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 9 }}>
            <div>
              <div style={{ color: '#888' }}>Avg:</div>
              <div style={{ color: data.avgDuration > 100 ? '#FF9800' : '#FFF' }}>
                {data.avgDuration?.toFixed(1)}ms
              </div>
            </div>
            <div>
              <div style={{ color: '#888' }}>Success:</div>
              <div style={{ color: data.successRate < 0.9 ? '#FF9800' : '#4CAF50' }}>
                {(data.successRate * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ color: '#888' }}>Count:</div>
              <div style={{ color: '#FFF' }}>
                {data.count}
              </div>
            </div>
            {data.lastExecution && (
              <div>
                <div style={{ color: '#888' }}>Last:</div>
                <div style={{ color: '#FFF', fontSize: 8 }}>
                  {data.lastExecution.duration?.toFixed(1)}ms
                </div>
              </div>
            )}
          </div>
          {data.recentMemoryUsage && (
            <div style={{ marginTop: 4, fontSize: 8 }}>
              <div style={{ color: '#888' }}>Memory:</div>
              <div style={{ color: data.recentMemoryUsage > 1024 ? '#FF9800' : '#4CAF50' }}>
                {(data.recentMemoryUsage / 1024).toFixed(1)}KB
              </div>
            </div>
          )}
        </div>
      ))}
      
      {Object.keys(metrics).length === 0 && (
        <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>
          No telemetry data available
        </div>
      )}
    </div>
  )
}