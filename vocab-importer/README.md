# Vocab Importer

A tool to facilitate vocabulary import, management, and learning for language students and educators.

## Features

- **Vocabulary Import**: Import vocabulary lists from various formats (CSV, Excel, TXT)
- **Automatic Translations**: Auto-translate terms using integrated translation APIs
- **Categorization**: Organize vocabulary by categories, difficulty levels, or topics
- **Flashcard Generation**: Create digital flashcards from imported vocabulary
- **Learning Progress Tracking**: Track learning progress and review cycles
- **Export Functionality**: Export vocabulary lists to various formats
- **Search and Filter**: Easily find specific vocabulary items

## Directory Structure

```
vocab-importer/
│
├── public/                # Static files
│   ├── index.html        # Main HTML file
│   ├── styles/           # CSS files
│   └── images/           # Image assets
│
├── src/                   # Source code
│   ├── components/       # React/UI components
│   ├── services/         # Service layer for API interactions
│   ├── utils/            # Utility functions
│   └── App.js            # Main application component
│
├── server/                # Backend code
│   ├── api/              # API routes
│   ├── models/           # Data models
│   ├── controllers/      # Business logic
│   └── server.js         # Express server setup
│
├── scripts/               # Build and deployment scripts
│
├── tests/                 # Test files
│
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your API keys
4. Start the development server: `npm start`
5. Access the application at `http://localhost:3000`

## Configuration

The application can be configured using environment variables in the `.env` file:

```
GROQ_API_KEY=your_groq_api_key_here
API_KEY=your_api_key_here
DATABASE_URL=your_database_url
PORT=3000
```

### API Keys Required

- **GROQ API Key**: Used for AI-powered translations and vocabulary assistance. You can obtain a GROQ API key by signing up at [GROQ's website](https://console.groq.com/keys).

## Development

This project was created and can be run using [Replit.com](https://replit.com), an online IDE and hosting platform. You can fork and modify the project directly in Replit's collaborative environment.

To run the project locally:

```bash
npm install
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Replit.com for providing the development environment
- Open-source language learning resources that inspired this project
