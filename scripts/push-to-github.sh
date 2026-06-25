#!/bin/bash
# Push CapitalStack to GitHub
# Run this after setting up your GitHub credentials

cd /data/data/com.termux/files/home/capitalstack

# Option 1: Use SSH (recommended)
# git remote set-url origin git@github.com:xmrtdao/capitalstack.git
# git push -u origin master

# Option 2: Use HTTPS with token
# git remote set-url origin https://YOUR_TOKEN@github.com/xmrtdao/capitalstack.git
# git push -u origin master

# Option 3: Use git credential helper
git credential-cache store
git push -u origin master

echo ""
echo "✅ CapitalStack ready to push!"
echo ""
echo "Next steps:"
echo "1. Set up GitHub credentials (SSH key or PAT)"
echo "2. Run: git push -u origin master"
echo "3. Enable GitHub Pages: Settings > Pages > Source: gh-pages branch"
echo ""
