const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

app.post('/deploy-ollama', async (req, res) => {
  const vmName = `ollama-${Math.floor(Math.random() * 1000)}`;
  const resourceGroup = "rg-llm-demo";
  const location = "australiaeast";
  const username = "azureuser";

  // Step 1: Create VM + open port
  const createCmd = `
    az group create --name ${resourceGroup} --location ${location} &&
    az vm create \
      --resource-group ${resourceGroup} \
      --name ${vmName} \
      --image Ubuntu2204 \
      --size Standard_B1s \
      --admin-username ${username} \
      --generate-ssh-keys \
      --public-ip-sku Basic \
      --location ${location} \
      --output none &&
    az vm open-port --resource-group ${resourceGroup} --name ${vmName} --port 11434
  `;

  exec(createCmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Create VM Error:", stderr);
      return res.status(500).json({ message: "Deployment failed", error: stderr });
    }

    // Step 2: Get public IP
    const ipCmd = `az vm show -g ${resourceGroup} -n ${vmName} --show-details --query publicIps -o tsv`;
    exec(ipCmd, (ipErr, ipStdout, ipStderr) => {
      if (ipErr) {
        console.error("IP Fetch Error:", ipStderr);
        return res.status(500).json({ message: "Failed to fetch public IP", error: ipStderr });
      }

      const ip = ipStdout.trim();

      // Step 3: SSH to install Ollama
      const sshCmd = `ssh -o StrictHostKeyChecking=no ${username}@${ip} "curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl restart ollama"`;

      exec(sshCmd, (sshErr, sshOut, sshStderr) => {
        if (sshErr) {
          console.error("SSH Error:", sshStderr);
          return res.status(500).json({ message: "Ollama install failed", error: sshStderr });
        }

        return res.json({
          message: "Ollama deployed successfully",
          vm: vmName,
          public_ip: ip,
          api_url: `http://${ip}:11434`
        });
      });
    });
  });
});

app.listen(4000, () => console.log("🚀 Webhook listening on port 4000"));
