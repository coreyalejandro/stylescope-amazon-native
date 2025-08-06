'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'

export const metadata = {
  title: 'PersonalityEngine Live Demo - StyleScope',
  description: 'Real-time testing of Alex Chen\'s personality engine with live results and metrics',
  viewport: 'width=device-width, initial-scale=1',
}

interface TestResult {
  id: string
  timestamp: string
  status: 'running' | 'success' | 'error'
  duration?: number
  data?: any
  error?: string
}

interface PersonalityMetrics {
  consistencyScore: number
  toneScore: number
  accessibilityScore: number
  authenticityScore: number
  overallScore: number
}

export default function PersonalityDemoPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [metrics, setMetrics] = useState<PersonalityMetrics | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const runTest = async (testType: string, testName: string) => {
    const testId = `${testType}-${Date.now()}`
    setCurrentTest(testId)
    
    const newTest: TestResult = {
      id: testId,
      timestamp: new Date().toISOString(),
      status: 'running'
    }
    
    setTestResults(prev => [newTest, ...prev])
    addLog(`🚀 Starting ${testName}`)

    const startTime = Date.now()

    try {
      let url = `/api/test/personality`
      let options: RequestInit = { method: 'GET' }

      switch (testType) {
        case 'health':
          url += '?mode=health'
          addLog('🔍 Checking PersonalityEngine health...')
          break
        case 'personality':
          url += '?mode=personality'
          addLog('👤 Fetching Alex Chen personality configuration...')
          break
        case 'validate':
          url += '?mode=validate'
          addLog('✅ Testing personality consistency validation...')
          break
        case 'generate':
          addLog('🎭 Generating sample commentary with Alex Chen personality...')
          break
        case 'custom':
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              episodeTitle: 'Live Demo Test',
              trendContext: 'Testing adaptive fashion trends for live demonstration'
            })
          }
          addLog('🎨 Generating custom commentary...')
          break
      }

      const response = await fetch(url, options)
      const result = await response.json()
      const duration = Date.now() - startTime

      if (result.success) {
        addLog(`✅ ${testName} completed successfully in ${duration}ms`)
        
        // Extract metrics if available
        if (testType === 'validate' && result.data) {
          const validation = result.data
          setMetrics({
            consistencyScore: validation.consistencyScore || 0,
            toneScore: 0.8, // Mock for demo
            accessibilityScore: 0.9, // Mock for demo
            authenticityScore: 0.85, // Mock for demo
            overallScore: (validation.consistencyScore || 0) * 0.8
          })
        }

        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', duration, data: result.data }
            : test
        ))
      } else {
        addLog(`❌ ${testName} failed: ${result.error?.message}`)
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', duration, error: result.error?.message }
            : test
        ))
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`💥 ${testName} crashed: ${errorMessage}`)
      
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', duration, error: errorMessage }
          : test
      ))
    }

    setCurrentTest(null)
  }

  const clearResults = () => {
    setTestResults([])
    setLogs([])
    setMetrics(null)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 animate-spin" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500'
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PersonalityEngine Live Demo</h1>
          <p className="text-muted-foreground">
            Real-time testing of Alex Chen's personality engine with live results and metrics
          </p>
        </div>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Personality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(metrics.consistencyScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Consistency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.toneScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Tone</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(metrics.accessibilityScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Accessibility</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(metrics.authenticityScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Authenticity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {(metrics.overallScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Overall</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => runTest('health', 'Health Check')}
              disabled={currentTest !== null}
              className="w-full justify-start"
            >
              🏥 Health Check
            </Button>
            <Button 
              onClick={() => runTest('personality', 'Personality Config')}
              disabled={currentTest !== null}
              className="w-full justify-start"
              variant="outline"
            >
              👤 View Personality
            </Button>
            <Button 
              onClick={() => runTest('validate', 'Consistency Validation')}
              disabled={currentTest !== null}
              className="w-full justify-start"
              variant="outline"
            >
              ✅ Test Validation
            </Button>
            <Button 
              onClick={() => runTest('generate', 'Generate Commentary')}
              disabled={currentTest !== null}
              className="w-full justify-start"
              variant="outline"
            >
              🎭 Generate Sample
            </Button>
            <Button 
              onClick={() => runTest('custom', 'Custom Commentary')}
              disabled={currentTest !== null}
              className="w-full justify-start"
              variant="outline"
            >
              🎨 Custom Generation
            </Button>
            <Button 
              onClick={() => runTest('comprehensive', 'Comprehensive Test Suite')}
              disabled={currentTest !== null}
              className="w-full justify-start"
              variant="destructive"
            >
              🔬 Full Test Suite
            </Button>
          </CardContent>
        </Card>

        {/* Live Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Live Execution Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-muted-foreground text-sm">
                    No logs yet. Run a test to see live execution.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="results" className="w-full">
            <TabsList>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="results" className="space-y-4">
              {testResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No test results yet. Run a test to see results here.
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <Badge variant="outline">
                            {result.duration}ms
                          </Badge>
                        )}
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              {testResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No detailed results yet.
                </div>
              ) : (
                <ScrollArea className="h-96">
                  {testResults.map((result) => (
                    <div key={result.id} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{result.id}</h3>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      {result.data && (
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                      {result.error && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                          {result.error}
                        </div>
                      )}
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}