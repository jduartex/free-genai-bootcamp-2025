# Installing Flask with zsh on macOS

This guide provides instructions for installing Flask and other Python dependencies using zsh shell on macOS.

## Basic Flask Installation

To install Flask only:

```zsh
pip install flask
```

or if you have multiple Python versions:

```zsh
pip3 install flask
```

## Installing All Project Dependencies

To install all required dependencies for the Japanese Listening Comprehension App:

```zsh
pip install -r requirements.txt
```

## Using Virtual Environments (Recommended)

It's best practice to use a virtual environment:

1. Create a new virtual environment:
   ```zsh
   python -m venv venv
   ```
   
2. Activate the virtual environment:
   ```zsh
   source venv/bin/activate
   ```
   
   Note: Your prompt should change to show `(venv)` at the beginning.
   
3. Install Flask inside the virtual environment:
   ```zsh
   pip install flask
   ```
   
   Or all requirements:
   ```zsh
   pip install -r requirements.txt
   ```
   
4. When finished, deactivate the environment:
   ```zsh
   deactivate
   ```

## Using the Install Script

We've provided an installation script that you can run:

1. Make it executable:
   ```zsh
   chmod +x install_dependencies.sh
   ```
   
2. Run it:
   ```zsh
   ./install_dependencies.sh
   ```

## Verifying Installation

After installing, verify Flask was installed correctly:

```zsh
python -c "import flask; print(f'Flask {flask.__version__} installed successfully')"
```

## Common Issues and Solutions

### Permission Errors

If you see permission errors:

```zsh
pip install --user flask
```

### Wrong Python Version

If the wrong Python version is being used:

```zsh
which python
which pip
```

You may need to specify a version:

```zsh
python3 -m pip install flask
```

### Pip Not Found

If pip is not found:

```zsh
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
```

### SSL Certificate Errors

If you encounter SSL certificate errors:

```zsh
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org flask
```
