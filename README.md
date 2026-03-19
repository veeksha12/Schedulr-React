# Schedulr - Wholesome & Professional Study Ecosystem

Schedulr is a comprehensive, AI-enhanced study ecosystem designed with a **wholesome, professional pastel aesthetic**. It helps students manage their academic workload, track productivity with gamified rewards, and achieve their goals in a calm, focused environment.

## 🚀 Features

### 🔐 User Authentication
- Secure email/password authentication
- Multiple user account support
- Independent progress tracking per user

### 📘 Multiple Planners
- Create unlimited study planners (semester, course, degree, certification)
- Each planner tracks target grades, study hours, and timelines
- Independent management and progress tracking

### ✅ Smart To-Do List
- Advanced task management with categories and priorities
- Task history tracking and undo functionality
- Search, filter, and date-based organization
- Progress tracking and completion statistics

### 📊 Grade & Time Management
- Course management with target vs current grades
- Exam tracking with weighted grading system
- Visual grade progress charts
- AI-powered difficulty assessment based on time commitment

### 📅 Study Scheduler
- Weekly calendar view with time-blocked sessions
- Priority-based scheduling
- Integration with tasks and exam deadlines
- Personalized timetable generation

### 🎮 Gamification Engine
-   **Level Up Your Learning**: Earn XP by completing tasks, focus sessions, and using AI optimizations.
-   **Student Progress**: Track your academic level and experience progress in the dashboard and sidebar.
-   **Cozy Rewards**: Visual feedback for consistent study habits and streak maintenance.

### ⏱️ Pomodoro Focus Timer
-   **Focus Sessions**: Integrated Pomodoro timer with customizable focus and break durations.
-   **Motivational Quotes**: Manual navigation for cycling through multiple inspirational prompts.
-   **Focus Logging**: Earn rewards for deep work sessions and maintain your productivity momentum.

### 📊 Github-Style Productivity Heatmap
-   **Visualize Consistency**: Track your task completion history over the last 20 weeks with a GitHub-inspired activity heatmap.
-   **Streak Tracking**: Monitor your study streak and habit consistency directly on the dashboard.

### 🤖 AI Optimizer (Smart Scheduler)
-   **AI Suggested Times**: Get AI-powered suggestions for the best times to work on your tasks.
-   **Rate-Limit Resilience**: Advanced exponential backoff implementation for stable AI interactions (Google Gemini).
-   **Adopt & Master**: Easily apply AI-suggested schedules to your calendar.

### 🎯 Wholesome Dashboard
-   **Real-time Statistics**: High-level overview of active planners, today's tasks, and exam deadlines.
-   **Premium Visuals**: Sage Green and Dusty Pink cards with smooth animations and rounded shapes.
-   **Cozy Log**: Recent activity and upcoming deadlines with a gentle, non-stressful UI.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Vanilla CSS with Wholesome Design System (Sage/Pink/Sand)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (with Password Reset)
- **AI Engine**: Google Gemini API
- **Charts**: Recharts (Grade Bar Chart)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

4. Set up Supabase:
   - Create a new Supabase project
   - Run the migration file in your Supabase SQL editor
   - Configure authentication settings

5. Start the development server:
   ```bash
   npm run dev
   ```

## 📱 Usage

1. **Sign up/Login**: Create an account or sign in
2. **Create Planners**: Set up your academic planners
3. **Add Tasks**: Organize your daily to-do items
4. **Track Grades**: Input courses and exam results
5. **Schedule Study**: Plan your study sessions
6. **Chat with AI**: Get personalized study advice

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the provided SQL migration
3. Configure Row Level Security (RLS)
4. Set up authentication providers

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### AI Assistant Setup (Google Gemini)

The AI chatbot feature requires a Google Gemini API key. Follow these steps to set it up:

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key

2. **Add to Environment**:
   - Open your `.env` file
   - Add the line: `VITE_GEMINI_API_KEY=your_api_key_here`
   - Replace `your_api_key_here` with your actual API key
   - Save the file and restart your development server

3. **Verify Setup**:
   - Navigate to the AI Assistant tab
   - If configured correctly, you should see no warning message
   - Try sending a message to test the chatbot

**Note**: If you see a yellow warning banner saying "API Key Not Configured", it means the environment variable is missing or incorrect. The chatbot will not work until you add a valid API key.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Schedulr** - Empowering students with the structure and flexibility they need to achieve academic success! 🎓