# TitanLift 🏋️‍♂️

**TitanLift** is a modern, full-stack workout tracking application designed for serious lifters. It combines precise anatomy analytics with gamification to help you train smarter and stay motivated.

![Dashboard Preview](https://github.com/whis24virus/titanlift/assets/placeholder/dashboard.png)
*(Note: Replace with actual screenshot URL after uploading images to repo)*

## 🚀 Key Features

### 🧬 Anatomy Heatmap
- **Visual Analytics**: See exactly which muscles you're training with a high-fidelity interactive 3D-like model.
- **Intensity Tracking**: Muscles glow darker emerald based on your training volume.
- **Dual Views**: Toggle between Anterior (Front) and Posterior (Back) to ensure balanced training.

### 🏆 Gamification System
- **Trophy Case**: Earn and collect persistent badges like "Heavy Lifter", "Speed Demon", and "Early Bird".
- **Streaks**: Track your consistency with daily activity streaks.
- **Leaderboards**: Compete globally on total volume lifted.

### 🏋️‍♂️ Advanced Logging
- **Smart History**: Auto-fills weights and reps from your previous session.
- **1RM Estimates**: Automatically calculates your One-Rep Max for every lift.
- **Calorie & Nutrition**: Integrated tracking for a complete fitness picture.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, React Body Highlighter.
- **Backend**: Rust, Axum, SQLx, Tokio.
- **Database**: PostgreSQL.
- **DevOps**: Docker, Docker Compose.

## 📦 Installation & Deployment

We support both local Docker setup and free cloud deployment.

### Quick Start (Local)

```bash
# Clone the repo
git clone https://github.com/whis24virus/titanlift.git
cd titanlift

# Start everything (App + DB)
docker compose up --build
```

Access the app at `http://localhost:8080`.

### Cloud Deployment
Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for a complete guide on how to deploy TitanLift for **free** using Render, Vercel, and Neon.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
