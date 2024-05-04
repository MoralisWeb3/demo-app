<div align="center">
    <a align="center" href="https://moralis.io" target="_blank">
      <img src="https://github.com/MoralisWeb3/Moralis-JS-SDK/raw/main/assets/moralis-logo.svg" alt="Moralis JS SDK" height=200/>
    </a>
    <h1 align="center">Moralis Demo Project</h1>
  <br/>
</div>

### Description
<p>Welcome to this Moralis Demo project! This is an open source project to demo the power of <a href="https://moralis.io?ref=demo-app" target="_blank">Moralis APIs</a>.</p>
<p>Note: this app contains many early stage, beta or experimental features. As a result bugs are highly likely.</p>

This demo app is comprised of a Nodejs server and a React frontend.

The Nodejs server runs at `http://localhost:3001/` whilst the frontend loads at `http://localhost:3000/`. 

<b><a href="https://moralis-portfolio-staging-f5f5e6cfeae8.herokuapp.com/" target="_blank">View a Live Demo</a></b>

### Prerequisites & Config
Before you begin, ensure you have met the following requirements:
- You have `git` installed on your computer.
- You have `Node.js` and `npm` (Node Package Manager) installed.
- You have a Moralis API key, get yours at <a href="https://admin.moralis.io/" target="_blank">https://admin.moralis.io/</a>

### Cloning the Repository

To clone this project, follow these steps:

1. Open your terminal (Command Prompt, PowerShell, or any other terminal).
2. Navigate to the directory where you want to clone the project.
3. Clone the repository by running:
`git clone git@github.com:MoralisWeb3/demo-app.git`
4. cd into the demo-app repository

### Local Development

#### Start Server
To start a local development server on `3001`, run the following command in the root of the project:


```sh
export API_KEY=.....
npm install
node index.js
```

Then, in a new terminal, switch to the client:
```sh
cd client
npm install
```

And start the React frontend:

```sh
npm start
```

(run `npm install react-scripts` if you get an error that `react-scripts` are missing)

The frontend will be available at `http://localhost:3000/`. 
