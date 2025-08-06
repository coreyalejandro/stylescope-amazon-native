'use client'

import { useState, useRef, useEffect } from 'react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'error' | 'debug'
  message: string
  data?: any
}

export default function LiveTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    }
    setLogs(prev => [...prev, entry])
  }

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const runRealTest = async () => {
    setIsRunning(true)
    setLogs([])
    setResults(null)

    addLog('info', '🚀 Starting REAL PersonalityEngine test with actual Bedrock calls')
    addLog('info', '📋 This will make actual API calls to Amazon Bedrock')

    try {
      addLog('debug', 'Making HTTP request to /api/test/personality?mode=comprehensive')
      
      const response = await fetch('/api/test/personality?mode=comprehensive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      addLog('debug', `Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      addLog('debug', 'Response received, parsing results...')

      if (result.success) {
        addLog('success', '✅ Test completed successfully')
        addLog('info', `📊 Results: ${result.data.summary.passed}/${result.data.summary.totalTests} tests passed`)
        
        // Log detailed results
        result.data.results.forEach((test: any, index: number) => {
          addLog(test.success ? 'success' : 'error', 
            `Test ${index + 1}: ${test.testName} - ${test.success ? 'PASSED' : 'FAILED'} (${test.duration}ms)`)
          
          if (test.logs) {
            test.logs.forEach((log: any) => {
              addLog('debug', `  └─ ${log.message}`)
            })
          }

          if (test.metrics) {
            addLog('info', `  📈 Metrics: Consistency ${(test.metrics.consistencyScore * 100).toFixed(1)}%, Overall ${(test.metrics.overallQuality * 100).toFixed(1)}%`)
          }

          if (test.error) {
            addLog('error', `  ❌ Error: ${test.error}`)
          }
        })

        setResults(result.data)
      } else {
        addLog('error', `❌ Test failed: ${result.error?.message}`)
        if (result.error?.stack) {
          addLog('debug', `Stack trace: ${result.error.stack}`)
        }
      }

    } catch (error) {
      addLog('error', `💥 Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Test error:', error)
    }

    setIsRunning(false)
  }

  const runSingleGeneration = async () => {
    setIsRunning(true)
    setLogs([])

    addLog('info', '🎭 Testing single commentary generation with real Bedrock')

    try {
      const response = await fetch('/api/test/personality', {
        method: 'GET'
      })

      const result = await response.json()

      if (result.success) {
        addLog('success', '✅ Commentary generated successfully')
        addLog('info', `⏱️ Generation time: ${result.data.metadata?.generationTime}ms`)
        addLog('info', `🔤 Tokens used: ${result.data.metadata?.tokensUsed}`)
        addLog('info', `📝 Personality version: ${result.data.metadata?.personalityVersion}`)
        
        if (result.data.generatedContent?.content) {
          addLog('success', '📄 Generated content preview:')
          addLog('debug', `Introduction: ${result.data.generatedContent.content.introduction?.substring(0, 100)}...`)
        }

        setResults(result.data)
      } else {
        addLog('error', `❌ Generation failed: ${result.error?.message}`)
      }

    } catch (error) {
      addLog('error', `💥 Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsRunning(false)
  }

  const clearLogs = () => {
    setLogs([])
    setResults(null)
  }

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00', 
      minHeight: '100vh' 
    }}>
      <h1 style={{ color: '#ffffff', marginBottom: '20px' }}>
        🔴 LIVE PersonalityEngine Test - REAL EXECUTION
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runRealTest}
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#666' : '#ff4444',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? '⏳ RUNNING...' : '🔥 RUN COMPREHENSIVE TEST'}
        </button>

        <button 
          onClick={runSingleGeneration}
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#666' : '#4444ff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? '⏳ RUNNING...' : '🎭 SINGLE GENERATION TEST'}
        </button>

        <button 
          onClick={clearLogs}
          style={{
            backgroundColor: '#666',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🗑️ CLEAR
        </button>
      </div>

      <div style={{
        backgroundColor: '#000000',
        border: '1px solid #333',
        borderRadius: '5px',
        padding: '15px',
        height: '400px',
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#888', marginBottom: '10px' }}>
          === LIVE EXECUTION LOG ===
        </div>
        
        {logs.length === 0 && (
          <div style={{ color: '#666' }}>
            Waiting for test execution... Click a button above to start.
          </div>
        )}

        {logs.map((log, index) => (
          <div key={index} style={{
            marginBottom: '5px',
            color: log.level === 'error' ? '#ff4444' : 
                  log.level === 'success' ? '#44ff44' :
                  log.level === 'debug' ? '#888888' : '#00ff00'
          }}>
            [{log.timestamp}] {log.message}
            {log.data && (
              <pre style={{ 
                fontSize: '12px', 
                marginLeft: '20px', 
                color: '#666',
                whiteSpace: 'pre-wrap'
              }}>
                {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
              </pre>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {results && (
        <div style={{
          backgroundColor: '#001100',
          border: '1px solid #00ff00',
          borderRadius: '5px',
          padding: '15px'
        }}>
          <h3 style={{ color: '#00ff00', marginBottom: '10px' }}>
            📊 EXECUTION RESULTS
          </h3>
          <pre style={{ 
            color: '#cccccc', 
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#330000', 
        border: '1px solid #ff0000',
        borderRadius: '5px'
      }}>
        <strong style={{ color: '#ff4444' }}>⚠️ WARNING:</strong>
        <div style={{ color: '#ffcccc', marginTop: '5px' }}>
          This makes REAL API calls to Amazon Bedrock. Each test will:
          <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
            <li>• Call actual Bedrock API endpoints</li>
            <li>• Use real tokens (costs money)</li>
            <li>• Show actual response times</li>
            <li>• Display real generated content</li>
            <li>• Reveal any actual errors or failures</li>
          </ul>
        </div>
      </div>
    </div>
  )
}