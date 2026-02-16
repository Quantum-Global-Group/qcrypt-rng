"""
Setup file for QCrypt RNG Python Client SDK
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="qcrypt-client",
    version="1.0.0",
    author="QCrypt Team",
    author_email="info@qcrypt.example.com",
    description="Python client SDK for QCrypt RNG API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/quantumGlobalGroup/qcrypt-rng",
    packages=find_packages(where="client_sdk/python"),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Security :: Cryptography",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
        "typing-extensions>=3.7.4"
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "pytest-cov>=2.0",
            "black>=21.0",
            "flake8>=3.8",
        ]
    },
    keywords="quantum, cryptography, random-number-generation, post-quantum, security",
    project_urls={
        "Bug Reports": "https://github.com/quantumGlobalGroup/qcrypt-rng/issues",
        "Source": "https://github.com/quantumGlobalGroup/qcrypt-rng",
        "Documentation": "https://qcrypt-rng.readthedocs.io/",
    },
)