# Getting an OpenAI API Key

The Japanese Listening Comprehension app uses OpenAI's API for question generation and (optionally) speech recognition. Follow these steps to get your API key:

## Steps to Get an OpenAI API Key

1. **Create an OpenAI Account**
   - Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
   - Sign up with your email, Google, or Microsoft account
   - Verify your email address if required

2. **Navigate to API Keys**
   - Log in to your OpenAI account
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Or click on your profile icon in the top-right corner → "API keys"

3. **Create a New API Key**
   - Click the "Create new secret key" button
   - Give your key a name (e.g., "Japanese Listening App")
   - Copy the generated key immediately (it will only be shown once)
   - IMPORTANT: Keep this key secure and never share it publicly

4. **Add Payment Method**
   - OpenAI requires a payment method to use the API
   - Go to [https://platform.openai.com/account/billing/payment-methods](https://platform.openai.com/account/billing/payment-methods)
   - Add a credit card or other supported payment method
   - Note: API usage for this app is minimal and should cost only a few cents per day of regular usage

## Adding the API Key to Your App

1. **Create a .env file** in the backend directory:
   ```bash
   cd /Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/listening-comp/backend
   touch .env
   ```

2. **Add your API key** to the .env file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Verify the key is working**:
   ```bash
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); import openai; client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY')); print('API Key is valid!' if client.models.list() else 'API Key issue')"
   ```

## Security Best Practices

1. **Never share your API key** or commit it to public repositories
2. **Set usage limits** in your OpenAI account to prevent unexpected charges
3. **Rotate your key** periodically for better security
4. **Use environment variables** instead of hardcoding the key in your code

## Monitoring Usage

- Monitor your API usage on the [OpenAI Usage Dashboard](https://platform.openai.com/account/usage)
- Set up usage limits at [https://platform.openai.com/account/limits](https://platform.openai.com/account/limits)

## Troubleshooting

If you encounter issues with your API key:

1. **Ensure the key is copied correctly** without extra spaces or characters
2. **Check your billing status** in your OpenAI account
3. **Verify your environment variables** are properly loaded
4. **Test with a simple API call** using the OpenAI playground
