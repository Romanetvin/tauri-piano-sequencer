# shadcn/ui Migration Guide

This guide provides detailed steps to migrate the Piano Player app from custom Tailwind CSS components to **shadcn/ui**, a collection of beautifully designed, accessible, and customizable React components built on Radix UI primitives.

## Table of Contents

1. [Why shadcn/ui?](#why-shadcnui)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Setup & Configuration](#phase-1-setup--configuration)
4. [Phase 2: Component Inventory & Mapping](#phase-2-component-inventory--mapping)
5. [Phase 3: Component Migration](#phase-3-component-migration)
6. [Phase 4: Theme Integration](#phase-4-theme-integration)
7. [Phase 5: Testing & Validation](#phase-5-testing--validation)
8. [Troubleshooting](#troubleshooting)

---

## Why shadcn/ui?

### Benefits
- **Accessibility**: Built on Radix UI with ARIA compliance out of the box
- **Customizable**: Components are copied to your project, not installed as dependencies
- **Type-safe**: Full TypeScript support
- **Beautiful**: Modern design with smooth animations
- **Consistent**: Design system with CSS variables for theming
- **Well-maintained**: Active development and community support

### Trade-offs
- Increases component folder size (components are copied, not imported)
- Learning curve for shadcn conventions and Radix primitives
- Migration effort for existing custom components

---

## Prerequisites

Before starting the migration:

- ✅ Node.js 16+ installed
- ✅ Current app running successfully
- ✅ Familiarity with React hooks and TypeScript
- ✅ Backup/commit current code to version control

---

## Phase 1: Setup & Configuration

### Step 1.1: Install Dependencies

Run the shadcn/ui CLI to initialize the project:

```bash
npx shadcn@latest init
```

**During the interactive setup, choose:**
- ✅ TypeScript: Yes
- ✅ Style: Default (or New York for more modern look)
- ✅ Base color: Slate (matches current gray theme)
- ✅ CSS variables: Yes
- ✅ React Server Components: No (using Vite)
- ✅ Components directory: `./src/components/ui`
- ✅ Utils directory: `./src/lib`
- ✅ Tailwind config: `tailwind.config.js`
- ✅ CSS file: `src/index.css`

This will create:
- `components.json` - shadcn configuration
- `src/lib/utils.ts` - Utility functions (cn helper)
- Update `src/index.css` with CSS variables
- Update `tailwind.config.js` with shadcn presets

### Step 1.2: Verify Installation

Check that these files were created/modified:

```bash
ls -la components.json
ls -la src/lib/utils.ts
cat tailwind.config.js
```

Expected `tailwind.config.js` additions:
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more color definitions
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Step 1.3: Update index.css

The shadcn init will add CSS variables. **Merge** with existing custom variables:

```css
@import "tailwindcss";

@layer base {
  :root {
    /* shadcn variables */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%; /* indigo-500 */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    /* shadcn dark mode variables */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%; /* indigo-400 for dark mode */
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Keep existing custom variables */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-gray-850: #1a1a1f;
  --color-gray-925: #0f0f14;
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  --shadow-glass-light: 0 8px 32px 0 rgba(100, 100, 100, 0.15);
}

/* Keep existing animations */
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
```

### Step 1.4: Install Initial Components

Install the most commonly needed components:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add slider
npx shadcn@latest add tooltip
npx shadcn@latest add toast
npx shadcn@latest add alert-dialog
npx shadcn@latest add tabs
```

This will create:
- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/use-toast.ts`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/tabs.tsx`

---

## Phase 2: Component Inventory & Mapping

### Current Component Audit

| Current Component | Type | shadcn Replacement | Migration Priority |
|------------------|------|-------------------|-------------------|
| TransportControls | Custom buttons | `Button` | High |
| ThemeToggle | Custom button | `Button` | High |
| Toast | Custom component | `Toast` + `Toaster` | High |
| AISettings | Modal with inputs | `Dialog` + `Input` + `Label` | High |
| AIMelodyGenerator | Complex modal | `Dialog` + `Select` + `Slider` + `Input` | High |
| ScaleSelector | Dropdown | `DropdownMenu` or `Select` | Medium |
| Reset Modal | Confirmation modal | `AlertDialog` | Medium |
| Export Menu | Dropdown | `DropdownMenu` | Medium |
| KeyboardGuide | Info panel | Custom (keep as-is) | Low |
| PianoRoll | Canvas component | Custom (keep as-is) | Low |
| VisualPiano | Interactive component | Custom (keep as-is) | Low |

### Migration Strategy

**High Priority** (Week 1):
1. Button components (TransportControls, ThemeToggle)
2. Toast notifications
3. AISettings modal
4. AIMelodyGenerator modal

**Medium Priority** (Week 2):
5. ScaleSelector dropdown
6. Reset confirmation modal
7. Export menu dropdown

**Low Priority** (Keep Custom):
- KeyboardGuide (unique UI)
- PianoRoll (canvas-based)
- VisualPiano (SVG-based)
- All piano-specific rendering components

---

## Phase 3: Component Migration

### 3.1: TransportControls → shadcn Button

**Current** (`src/components/TransportControls.tsx:17-54`):

```tsx
<button
  onClick={isPlaying ? onPause : onPlay}
  className="relative p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
             hover:shadow-lg hover:shadow-indigo-500/50
             transition-all duration-300 transform hover:scale-105 active:scale-95
             group"
  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
>
  {/* SVG icon */}
</button>
```

**After** (using shadcn Button):

```tsx
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
}) => {
  return (
    <div className="flex items-center gap-3">
      {/* Play/Pause Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={isPlaying ? onPause : onPlay}
              size="lg"
              className="relative rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
                         hover:shadow-lg hover:shadow-indigo-500/50
                         transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Stop Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onStop}
              variant="outline"
              size="lg"
              className="rounded-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
```

**Button Variants Available:**
- `default` - Primary button
- `destructive` - For dangerous actions
- `outline` - Bordered button
- `secondary` - Secondary action
- `ghost` - Minimal styling
- `link` - Text link style

**Button Sizes Available:**
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square for icon-only buttons

### 3.2: ThemeToggle → shadcn Button

**Current** (`src/components/ThemeToggle.tsx:8-43`):

```tsx
<button
  onClick={toggleTheme}
  className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800..."
  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
>
  {/* SVG icons */}
</button>
```

**After**:

```tsx
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Moon, Sun } from 'lucide-react'; // Optional: use lucide-react icons

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="rounded-lg"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {theme === 'light' ? 'dark' : 'light'} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

**Note**: Install lucide-react for better icon support:
```bash
npm install lucide-react
```

### 3.3: Toast → shadcn Toast

**Current** (`src/components/Toast.tsx`):
Custom implementation with manual state management.

**After**: Replace with shadcn's toast system.

**Step 3.3.1**: Update `App.tsx` to use shadcn Toaster:

```tsx
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

function App() {
  const { toast } = useToast();

  // Replace custom showSuccess with:
  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  };

  const showError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  return (
    <div>
      {/* ... existing app content ... */}

      {/* Replace custom toast container with: */}
      <Toaster />
    </div>
  );
}
```

**Step 3.3.2**: Update hooks to use shadcn toast:

Replace `src/hooks/useToast.ts` content with:

```tsx
// Re-export shadcn's useToast
export { useToast } from "@/components/ui/use-toast";
```

**Step 3.3.3**: Delete old custom Toast component:
```bash
rm src/components/Toast.tsx
```

**Toast Variants Available:**
- `default` - Standard notification
- `destructive` - Error/warning

**Toast Options:**
```tsx
toast({
  title: "Melody Generated!",
  description: "Added 24 notes to piano roll 🎵",
  variant: "default",
  duration: 5000, // milliseconds
});
```

### 3.4: AISettings → shadcn Dialog

**Current** (`src/components/AISettings.tsx:104-239`):
Custom modal with backdrop, custom inputs, and manual state management.

**After** (using Dialog + Input + Label):

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";

const AISettings: React.FC<AISettingsProps> = ({
  providers,
  onSaveApiKey,
  onDeleteApiKey,
  onTestConnection,
  onClose,
  isLoading,
}) => {
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '',
    gemini: '',
    anthropic: '',
    cohere: '',
  });

  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    gemini: false,
    anthropic: false,
    cohere: false,
  });

  // ... rest of state ...

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Configure API keys for AI melody generation. Your keys are encrypted and stored locally.
          </DialogDescription>
        </DialogHeader>

        {/* Provider List */}
        <div className="space-y-6 mt-4">
          {providers.map((provider) => (
            <div key={provider.name} className="border rounded-lg p-4">
              {/* Provider Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {provider.displayName}
                  </h3>
                  {provider.hasApiKey && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                      ✓ Configured
                    </span>
                  )}
                </div>
                {provider.hasApiKey && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleTest(provider.name)}
                      disabled={testResults[provider.name] === 'testing' || isLoading}
                      variant="secondary"
                      size="sm"
                    >
                      {testResults[provider.name] === 'testing' ? 'Testing...' :
                       testResults[provider.name] === 'success' ? '✓ Connected' :
                       testResults[provider.name] === 'error' ? '✗ Failed' : 'Test'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(provider.name)}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor={`api-key-${provider.name}`}>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`api-key-${provider.name}`}
                      type={showKeys[provider.name] ? 'text' : 'password'}
                      value={apiKeys[provider.name]}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.name]: e.target.value }))}
                      placeholder={provider.hasApiKey ? '••••••••••••••••' : 'Enter API key'}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => toggleShowKey(provider.name)}
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      type="button"
                    >
                      {showKeys[provider.name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleSave(provider.name)}
                    disabled={!apiKeys[provider.name].trim() || isLoading || saveStatus[provider.name] === 'saving'}
                  >
                    {saveStatus[provider.name] === 'saving' ? 'Saving...' :
                     saveStatus[provider.name] === 'success' ? '✓ Saved' :
                     saveStatus[provider.name] === 'error' ? '✗ Error' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a
                    href={getProviderUrl(provider.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {getProviderUrl(provider.name)}
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Key Changes:**
- Replace custom backdrop + modal div with `<Dialog>` + `<DialogContent>`
- Use `DialogHeader`, `DialogTitle`, `DialogDescription` for header
- Replace custom inputs with `<Input>` + `<Label>`
- Replace custom buttons with `<Button>`
- Use `text-muted-foreground` instead of `text-gray-500`
- Use `text-primary` instead of `text-indigo-500`

### 3.5: AIMelodyGenerator → shadcn Dialog with Complex Inputs

**Current** (`src/components/AIMelodyGenerator.tsx`):
Complex modal with textarea, select, slider, and multiple sections.

**After**:

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings, Sparkles } from "lucide-react";

const AIMelodyGenerator: React.FC<AIMelodyGeneratorProps> = ({
  providers,
  selectedScale,
  selectedTrackId,
  onGenerate,
  onImport,
  onOpenSettings,
  onClose,
  isLoading,
  canCancel,
  onCancel,
  rateLimitState,
}) => {
  // ... existing state ...

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Melody Generator
          </DialogTitle>
          <DialogDescription>
            Generate melodies using AI. Describe what you want and let AI compose for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={(value) => setSelectedProvider(value as AIProvider)}
              disabled={isLoading}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem
                    key={provider.name}
                    value={provider.name}
                    disabled={!provider.hasApiKey}
                  >
                    {provider.displayName}
                    {!provider.hasApiKey && ' (Not configured)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {providers.filter(p => p.hasApiKey).length === 0 && (
              <p className="text-sm text-destructive">
                No API keys configured.{' '}
                <Button variant="link" className="p-0 h-auto" onClick={onOpenSettings}>
                  Configure now
                </Button>
              </p>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Melody Description</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the melody you want (e.g., 'A cheerful upbeat melody in C major with eighth notes')"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Measures Input */}
          <div className="space-y-2">
            <Label htmlFor="measures">Measures (bars)</Label>
            <Input
              id="measures"
              type="number"
              min={1}
              max={16}
              value={measures}
              onChange={(e) => setMeasures(Number(e.target.value))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              1-16 measures (4 beats per measure)
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Creativity</Label>
              <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(values) => setTemperature(values[0])}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative (0.0)</span>
              <span>Creative (2.0)</span>
            </div>
          </div>

          {/* Scale Selection */}
          <div className="space-y-2">
            <Label>Scale</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-custom-scale"
                checked={useCustomScale}
                onChange={(e) => setUseCustomScale(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4"
              />
              <label htmlFor="use-custom-scale" className="text-sm">
                Use custom scale (overrides track scale)
              </label>
            </div>
            {useCustomScale && (
              <ScaleSelector
                selectedScale={customScale}
                onScaleChange={setCustomScale}
              />
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Generated Response Preview */}
          {generatedResponse && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Generated Melody Preview</h4>
              <div className="text-sm space-y-1">
                <p>Notes: {generatedResponse.notes.length}</p>
                <p>Duration: {(generatedResponse.notes[generatedResponse.notes.length - 1]?.startTime +
                              generatedResponse.notes[generatedResponse.notes.length - 1]?.duration || 0).toFixed(1)} beats</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!generatedResponse ? (
              <>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating... {elapsedSeconds}s
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                {canCancel && (
                  <Button
                    onClick={onCancel}
                    variant="destructive"
                  >
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    onImport(generatedResponse, selectedTrackId, overlay);
                    onClose();
                  }}
                  className="flex-1"
                >
                  Import to Piano Roll
                </Button>
                <Button
                  onClick={() => setGeneratedResponse(null)}
                  variant="outline"
                >
                  Generate New
                </Button>
              </>
            )}
          </div>

          {/* Settings Link */}
          <div className="text-center">
            <Button variant="link" onClick={onOpenSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Configure API Keys
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Key Components Used:**
- `Dialog` - Modal container
- `Select` - Dropdown for provider selection
- `Textarea` - Multi-line prompt input
- `Input` - Number input for measures
- `Slider` - Temperature control
- `Button` - All action buttons
- `Loader2` from lucide-react - Loading spinner

### 3.6: ScaleSelector → shadcn Select or DropdownMenu

**Option A: Using Select** (recommended for single selection):

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Music } from "lucide-react";

const ScaleSelector: React.FC<ScaleSelectorProps> = ({ selectedScale, onScaleChange }) => {
  const currentValue = selectedScale
    ? `${selectedScale.root}-${selectedScale.mode}`
    : 'none';

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onScaleChange(null);
    } else {
      const [root, mode] = value.split('-') as [RootNote, ScaleMode];
      onScaleChange({ root, mode });
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <Music className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select scale" />
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <SelectItem value="none">
          <span className="font-medium">None</span>
          <span className="text-xs text-muted-foreground ml-2">(No highlighting)</span>
        </SelectItem>

        {ROOT_NOTES.map((root) => (
          <SelectGroup key={root}>
            <SelectLabel>{root}</SelectLabel>
            <SelectItem value={`${root}-major`}>Major</SelectItem>
            <SelectItem value={`${root}-minor`}>Minor</SelectItem>
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};
```

**Option B: Using DropdownMenu** (if you prefer the current dropdown style):

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Music, ChevronDown } from "lucide-react";

const ScaleSelector: React.FC<ScaleSelectorProps> = ({ selectedScale, onScaleChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="text-sm">
              {selectedScale ? getScaleName(selectedScale.root, selectedScale.mode) : 'No Scale'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] max-h-[400px] overflow-y-auto">
        <DropdownMenuItem onClick={() => onScaleChange(null)}>
          <span className="font-medium">None</span>
          <span className="text-xs text-muted-foreground ml-2">(No highlighting)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {ROOT_NOTES.map((root) => (
          <React.Fragment key={root}>
            <DropdownMenuLabel>{root}</DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 px-2">
              <DropdownMenuItem onClick={() => onScaleChange({ root, mode: 'major' })}>
                Major
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onScaleChange({ root, mode: 'minor' })}>
                Minor
              </DropdownMenuItem>
            </div>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### 3.7: Reset Modal → shadcn AlertDialog

**Current** (`src/App.tsx:578-658`):
Custom modal with backdrop and multiple action buttons.

**After**:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// In App.tsx:
{showResetModal && (
  <AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            Reset Piano Roll
            <p className="text-sm font-normal text-muted-foreground">This will clear all notes</p>
          </div>
        </AlertDialogTitle>
        <AlertDialogDescription>
          Do you want to export your current melody before clearing?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col gap-2">
        {/* Export & Clear */}
        <div className="flex gap-2 w-full">
          <Button
            onClick={() => handleResetWithExport('midi')}
            className="flex-1"
          >
            Export MIDI & Clear
          </Button>
          <Button
            onClick={() => handleResetWithExport('json')}
            className="flex-1"
          >
            Export JSON & Clear
          </Button>
        </div>

        {/* Clear without Export */}
        <Button
          onClick={handleResetWithoutExport}
          variant="destructive"
          className="w-full"
        >
          Clear without Exporting
        </Button>

        {/* Cancel */}
        <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

### 3.8: Export Menu → shadcn DropdownMenu

**Current** (`src/App.tsx:366-413`):
Custom dropdown with backdrop.

**After**:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, Music, FileJson } from "lucide-react";

// In App.tsx top bar:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      <Download className="h-5 w-5" />
      <span>Export</span>
      <ChevronDown className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleExport('midi')}>
      <Music className="mr-2 h-4 w-4" />
      Export as MIDI (default)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleExport('json')}>
      <FileJson className="mr-2 h-4 w-4" />
      Export as JSON
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Phase 4: Theme Integration

### 4.1: Update ThemeContext to Support shadcn CSS Variables

The current `ThemeContext` toggles the `dark` class on the root element, which is perfect for shadcn. No changes needed!

**Current** (`src/context/ThemeContext.tsx`):
```tsx
// Already compatible with shadcn!
document.documentElement.classList.toggle('dark', newTheme === 'dark');
```

### 4.2: Customize shadcn Colors to Match Piano App

Update `src/index.css` to match your brand colors:

```css
@layer base {
  :root {
    /* Match your existing indigo-purple gradient */
    --primary: 238 73% 59%; /* indigo-500: #6366f1 */
    --primary-foreground: 0 0% 100%;

    /* Adjust other colors as needed */
    --secondary: 250 95% 76%; /* purple-400 */
    --accent: 221 83% 53%; /* indigo-500 */

    /* Keep existing background colors */
    --background: 0 0% 98%; /* gray-50 */
    --foreground: 222.2 47.4% 11.2%; /* gray-900 */
  }

  .dark {
    --primary: 221 91% 60%; /* indigo-400 for dark */
    --primary-foreground: 0 0% 100%;

    --background: 0 0% 4%; /* gray-950 */
    --foreground: 210 40% 98%; /* gray-100 */
  }
}
```

### 4.3: Test Dark Mode Toggle

Ensure all shadcn components respond to theme changes:

```bash
npm run dev
```

1. Toggle dark mode with ThemeToggle button
2. Verify all dialogs, buttons, inputs update colors
3. Check toast notifications in both themes

---

## Phase 5: Testing & Validation

### 5.1: Functional Testing Checklist

- [ ] **TransportControls**
  - [ ] Play/Pause button works
  - [ ] Stop button works
  - [ ] Tooltips appear on hover
  - [ ] Space bar shortcut still works

- [ ] **ThemeToggle**
  - [ ] Toggles between light and dark mode
  - [ ] All components update colors
  - [ ] Icons change correctly

- [ ] **Toast Notifications**
  - [ ] Success toasts appear
  - [ ] Error toasts appear (test with invalid AI request)
  - [ ] Toasts auto-dismiss after duration
  - [ ] Manual close button works

- [ ] **AISettings Modal**
  - [ ] Opens from AI button
  - [ ] Can input API keys
  - [ ] Show/hide password toggle works
  - [ ] Save button stores keys
  - [ ] Test connection button works
  - [ ] Delete button removes keys
  - [ ] Closes on backdrop click
  - [ ] Closes on X button

- [ ] **AIMelodyGenerator Modal**
  - [ ] Opens from AI button / Ctrl+Shift+G
  - [ ] Provider selection works
  - [ ] Prompt input works
  - [ ] Measures slider works
  - [ ] Temperature slider works
  - [ ] Scale selector works
  - [ ] Generate button triggers AI
  - [ ] Loading state shows spinner
  - [ ] Error messages display
  - [ ] Import button adds notes to piano roll

- [ ] **ScaleSelector**
  - [ ] Opens dropdown menu
  - [ ] Can select any scale
  - [ ] "None" option clears selection
  - [ ] Selected scale displays correctly
  - [ ] Piano roll highlights correct notes

- [ ] **Reset Modal**
  - [ ] Opens from Reset button
  - [ ] Export MIDI & Clear works
  - [ ] Export JSON & Clear works
  - [ ] Clear without Export works
  - [ ] Cancel button closes modal

- [ ] **Export Menu**
  - [ ] Opens dropdown
  - [ ] Export MIDI works
  - [ ] Export JSON works

### 5.2: Accessibility Testing

shadcn components are built on Radix UI, which has excellent accessibility. Test:

- [ ] **Keyboard Navigation**
  - [ ] Tab through all interactive elements
  - [ ] Enter/Space activates buttons
  - [ ] Escape closes modals
  - [ ] Arrow keys navigate dropdowns

- [ ] **Screen Reader**
  - [ ] Test with VoiceOver (macOS) or NVDA (Windows)
  - [ ] All buttons have labels
  - [ ] Form inputs have associated labels
  - [ ] Modals announce title/description

- [ ] **Focus Management**
  - [ ] Opening modal traps focus
  - [ ] Closing modal returns focus
  - [ ] No focus loss during interactions

### 5.3: Performance Testing

- [ ] **Bundle Size**
  ```bash
  npm run build
  # Check dist/assets/*.js sizes
  ```
  - Note: shadcn components add ~50-100KB to bundle (gzipped)

- [ ] **Rendering Performance**
  - [ ] No lag when opening modals
  - [ ] No lag when toggling theme
  - [ ] No lag when updating slider values

- [ ] **Piano Playback**
  - [ ] Keyboard notes still play without delay
  - [ ] Playback still works smoothly
  - [ ] No audio glitches

### 5.4: Browser Compatibility

Test on:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)

---

## Troubleshooting

### Issue: "Cannot find module '@/components/ui/button'"

**Cause**: Path alias `@` not configured.

**Fix**: Update `vite.config.ts`:

```typescript
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ... rest of config
});
```

And update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "Tailwind classes not applying to shadcn components"

**Cause**: Tailwind not scanning shadcn components.

**Fix**: Update `tailwind.config.js`:

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/ui/**/*.{js,ts,jsx,tsx}", // Add this line
  ],
  // ...
}
```

### Issue: "Dark mode not working"

**Cause**: `darkMode` not set to `"class"` in Tailwind config.

**Fix**: Ensure `tailwind.config.js` has:

```js
export default {
  darkMode: ["class"], // or just "class"
  // ...
}
```

### Issue: "Toast notifications not appearing"

**Cause**: `<Toaster />` not added to app.

**Fix**: Ensure `App.tsx` includes:

```tsx
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <div>
      {/* ... app content ... */}
      <Toaster />
    </div>
  );
}
```

### Issue: "Dialog doesn't trap focus"

**Cause**: Missing Radix Portal or conflicting z-index.

**Fix**: Ensure dialog has high z-index:

```tsx
<DialogContent className="z-50">
  {/* ... */}
</DialogContent>
```

### Issue: "Animations not working"

**Cause**: Missing `tailwindcss-animate` plugin.

**Fix**: Install and configure:

```bash
npm install tailwindcss-animate
```

```js
// tailwind.config.js
export default {
  plugins: [require("tailwindcss-animate")],
}
```

### Issue: "Icons not displaying"

**Cause**: `lucide-react` not installed.

**Fix**:

```bash
npm install lucide-react
```

Then import icons:

```tsx
import { Music, Download, Settings } from "lucide-react";
```

---

## Additional Resources

### shadcn/ui Documentation
- Official docs: https://ui.shadcn.com/
- Component examples: https://ui.shadcn.com/docs/components
- Themes: https://ui.shadcn.com/themes

### Radix UI Documentation
- Primitives: https://www.radix-ui.com/primitives
- Accessibility: https://www.radix-ui.com/primitives/docs/overview/accessibility

### Tailwind CSS
- v4 docs: https://tailwindcss.com/
- Dark mode: https://tailwindcss.com/docs/dark-mode

### Community
- shadcn GitHub: https://github.com/shadcn-ui/ui
- Discord: https://discord.gg/shadcn

---

## Migration Timeline

**Estimated Duration**: 2-3 weeks (depending on complexity)

### Week 1: Setup + High Priority Components
- Day 1-2: Setup and configuration (Phase 1)
- Day 3-4: Migrate buttons and toast (Phase 3.1-3.3)
- Day 5: Migrate AISettings modal (Phase 3.4)

### Week 2: Complex Components
- Day 1-2: Migrate AIMelodyGenerator modal (Phase 3.5)
- Day 3: Migrate ScaleSelector (Phase 3.6)
- Day 4: Migrate Reset modal and Export menu (Phase 3.7-3.8)
- Day 5: Theme integration (Phase 4)

### Week 3: Testing & Polish
- Day 1-2: Functional testing (Phase 5.1)
- Day 3: Accessibility testing (Phase 5.2)
- Day 4: Performance testing (Phase 5.3)
- Day 5: Browser compatibility + bug fixes (Phase 5.4)

---

## Post-Migration Cleanup

After successful migration:

1. **Remove unused files**:
   ```bash
   # Old custom Toast component (if replaced)
   rm src/components/Toast.tsx
   ```

2. **Remove unused dependencies** (if any custom modal/dropdown libs were used):
   ```bash
   npm uninstall [old-package-name]
   ```

3. **Update documentation**:
   - Update CLAUDE.md with new component structure
   - Document shadcn customizations
   - Add notes about theme system

4. **Create git commit**:
   ```bash
   git add .
   git commit -m "refactor: migrate to shadcn/ui component library

   - Replace custom buttons with shadcn Button
   - Replace modals with Dialog and AlertDialog
   - Replace dropdowns with DropdownMenu and Select
   - Implement Toast system with Toaster
   - Update theme system to use CSS variables
   - Maintain all existing functionality
   - Improve accessibility with Radix UI primitives"
   ```

---

## Notes & Best Practices

### DO:
✅ Test each component after migration
✅ Keep piano-specific components (PianoRoll, VisualPiano) custom
✅ Use shadcn's CSS variables for theming
✅ Leverage `cn()` utility for conditional classes
✅ Use lucide-react icons for consistency
✅ Follow shadcn naming conventions (ui/ folder)

### DON'T:
❌ Migrate all components at once (do it incrementally)
❌ Modify shadcn components directly (extend them instead)
❌ Remove dark mode support
❌ Break existing keyboard shortcuts
❌ Change audio playback functionality

### Tips:
💡 Use `asChild` prop to compose components without wrapper divs
💡 Customize shadcn components by editing `src/components/ui/*.tsx`
💡 Use `variant` prop for different button/component styles
💡 Leverage Radix's `Portal` for proper modal rendering
💡 Use `TooltipProvider` at app root or per-component

---

## Conclusion

This migration will:
- ✨ Improve UI consistency and polish
- ♿ Enhance accessibility
- 🎨 Simplify theming and styling
- 🚀 Speed up future UI development
- 📦 Provide battle-tested components

The investment in migration will pay off with a more maintainable, accessible, and professional application!

**Good luck with your migration! 🎹🎵**
