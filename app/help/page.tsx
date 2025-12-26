import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  FolderPlus, 
  Upload, 
  MessageSquare, 
  Bot, 
  FileText, 
  Settings,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Zap,
  Target,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AutoRFP Help Center</h1>
              <p className="text-muted-foreground mt-2">
                Learn how to automate your RFP responses with AI-powered document processing
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to App</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Quick Start Guide
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Set Up Organization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Create your organization and invite team members with different roles.
                </p>
                <Badge variant="secondary">5 minutes</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Upload Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload your RFP documents and knowledge base files for AI processing.
                </p>
                <Badge variant="secondary">2 minutes</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Generate Responses</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Let AI extract questions and generate professional responses automatically.
                </p>
                <Badge variant="secondary">1 minute</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Workflow */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Complete Workflow
          </h2>

          <div className="space-y-8">
            {/* Step 1: Organization Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organization & Team Management
                </CardTitle>
                <CardDescription>
                  Set up your workspace and collaborate with your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Creating an Organization</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Click &quot;Create Organization&quot; on the dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Enter organization name and description
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        LlamaCloud auto-connects if available
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Team Collaboration (coming soon)</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Invite members via email in Team settings
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Assign roles: Owner, Admin, or Member
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Manage permissions and access control
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Project Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="h-5 w-5" />
                  Project Management
                </CardTitle>
                <CardDescription>
                  Organize your RFPs into manageable projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Creating Projects</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Navigate to your organization dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Click &quot;Create Project&quot; button
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Add project name and description
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Best Practices</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        One project per RFP or client
                      </li>
                      <li className="flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        Use descriptive names for easy identification
                      </li>
                      <li className="flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        Add detailed descriptions for team clarity
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Document Upload & Processing
                </CardTitle>
                <CardDescription>
                  Upload RFP documents and build your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Supported File Types</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        PDF documents (.pdf)
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Word documents (.docx, .doc)
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Excel spreadsheets (.xlsx, .xls)
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        PowerPoint presentations (.pptx, .ppt)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Upload Process</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Drag & drop files or click to browse
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        AI automatically processes documents
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Questions are extracted and organized
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Try with Sample Document
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    New to the platform? Download our sample RFP document to test the features:
                  </p>
                  <a 
                    href="https://qluspotebpidccpfbdho.supabase.co/storage/v1/object/public/sample-files//RFP%20-%20Launch%20Services%20for%20Medium-Lift%20Payloads.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    RFP - Launch Services for Medium-Lift Payloads.pdf →
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: AI Response Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Response Generation
                </CardTitle>
                <CardDescription>
                  Generate professional responses using advanced AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Response Types</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <strong>Quick Response:</strong> Fast, direct answers
                      </li>
                      <li className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <strong>Multi-Step:</strong> Detailed analysis process
                      </li>
                      <li className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <strong>Custom:</strong> Edit and refine responses
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">AI Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Source attribution and relevance scoring
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Context-aware responses from your docs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Professional RFP response formatting
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Multi-Step Response Process</h4>
                  <div className="grid gap-2 text-sm text-purple-800">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-xs font-medium">1</span>
                      Analyze question requirements and complexity
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-xs font-medium">2</span>
                      Search through your document knowledge base
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-xs font-medium">3</span>
                      Extract and synthesize relevant information
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-xs font-medium">4</span>
                      Structure professional RFP response
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-xs font-medium">5</span>
                      Validate completeness and accuracy
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tips & Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Tips & Best Practices
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Upload comprehensive docs</p>
                    <p className="text-xs text-muted-foreground">Include company overviews, technical specs, and past responses</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Keep documents updated</p>
                    <p className="text-xs text-muted-foreground">Regularly refresh your knowledge base with latest information</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Use clear file names</p>
                    <p className="text-xs text-muted-foreground">Descriptive names help AI find relevant content faster</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Review AI responses</p>
                    <p className="text-xs text-muted-foreground">Always review and customize responses before submission</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Check source citations</p>
                    <p className="text-xs text-muted-foreground">Verify that sources are relevant and up-to-date</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Use multi-step for complex questions</p>
                    <p className="text-xs text-muted-foreground">Get detailed analysis for technical or multi-part questions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Settings & Configuration */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings & Configuration
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Configure your organization&apos;s AI and integration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">LlamaCloud Integration</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Connects automatically when creating organizations</li>
                    <li>• Enables advanced document indexing and search</li>
                    <li>• Improves AI response accuracy and relevance</li>
                    <li>• View connection status in settings</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Team Management</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Invite team members via email</li>
                    <li>• Set appropriate roles and permissions</li>
                    <li>• Manage access to projects and documents</li>
                    <li>• Monitor team activity and usage</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Need More Help?</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Try the platform with our sample RFP documents
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://qluspotebpidccpfbdho.supabase.co/storage/v1/object/public/sample-files//RFP%20-%20Launch%20Services%20for%20Medium-Lift%20Payloads.pdf"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Download Sample
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Get help with issues or feature requests
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/your-repo/auto_rfp/issues" target="_blank" rel="noopener noreferrer">
                    Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
} 