# Introduction

This is material design template created based on materially structure

# Getting Started

1. Installation process
    - install package
    ```bash
    yarn
    ```
    - login doppler(if you're not logon.)
    ```bash
    doppler login
    ```
    - setup doppler
    ```bash
    doppler setup
    ```
    - start dev server
        - option 1: run with doppler command
            ```bash
            # package.json (script)
            "start": "react-scripts start"
            # run with
            doppler run -- yarn start

            ====OR====
            
            !Recommend!
            # package.json (script)
            "start": "doppler run -- react-scripts start"
            # run with
            yarn start
            ```
        - option 2: download environment file and run with yarn
            ```bash
            doppler secrets download --no-file --format env >> .env  
            # package.json (script)
            "start": "react-scripts start"
            # run with
            yarn start
            ```
2. Deployment process
    - Goto full-version directory and open package.json. Update homepage URL to the production URL
    - Goto full-version directory and run 'yarn build'


 > **_NOTE:_** can register doppler at https://www.doppler.com/
