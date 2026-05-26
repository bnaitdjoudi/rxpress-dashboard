# Migration auth SSH : mot de passe → clé RSA

## 1. Créer le compte dédié sur le serveur Hestia

```bash
# Depuis la machine locale ou le serveur Laravel — transférer le fichier sudoers
scp deployment/sudoers-rxpress <user>@<hestia-host>:/tmp/sudoers-rxpress

# Sur le serveur Hestia
sudo adduser --disabled-password --gecos "" rxpress-deploy
sudo cp /tmp/sudoers-rxpress /etc/sudoers.d/rxpress-deploy
sudo chmod 440 /etc/sudoers.d/rxpress-deploy
sudo visudo -c -f /etc/sudoers.d/rxpress-deploy   # vérification syntaxe
sudo rm /tmp/sudoers-rxpress
```

## 2. Générer la paire de clés sur le serveur Laravel

```bash
# Sur le serveur Laravel (ou en local, puis copier)
sudo mkdir -p /etc/rxpress
sudo ssh-keygen -t ed25519 -f /etc/rxpress/ssh_id -C "rxpress-dashboard" -N ""
sudo chown www-data:www-data /etc/rxpress/ssh_id /etc/rxpress/ssh_id.pub
sudo chmod 600 /etc/rxpress/ssh_id
sudo chmod 644 /etc/rxpress/ssh_id.pub
```

## 3. Déployer la clé publique sur le serveur Hestia

```bash
# Sur le serveur Hestia
sudo -u rxpress-deploy mkdir -p /home/rxpress-deploy/.ssh
sudo -u rxpress-deploy chmod 700 /home/rxpress-deploy/.ssh

# Coller le contenu de /etc/rxpress/ssh_id.pub dans authorized_keys
sudo -u rxpress-deploy nano /home/rxpress-deploy/.ssh/authorized_keys
sudo -u rxpress-deploy chmod 600 /home/rxpress-deploy/.ssh/authorized_keys
```

## 4. Mettre à jour le .env Laravel

```dotenv
# Remplacer :
SSH_USERNAME=rxpress-deploy
SSH_PRIVATE_KEY_PATH=/etc/rxpress/ssh_id
# SSH_PRIVATE_KEY_PASSPHRASE=   # laisser vide si pas de passphrase

# Retirer ensuite (une fois vérifié) :
# SSH_PASSWORD=...
```

## 5. Préparer le répertoire SSH de www-data

```bash
# Sur le serveur Laravel
sudo mkdir -p /var/www/.ssh
sudo chown www-data:www-data /var/www/.ssh
sudo chmod 700 /var/www/.ssh

# Pré-enregistrer le fingerprint du serveur Hestia (évite les prompts interactifs)
sudo -u www-data ssh-keyscan -H <hestia-host> | sudo tee -a /var/www/.ssh/known_hosts > /dev/null
sudo chown www-data:www-data /var/www/.ssh/known_hosts
sudo chmod 600 /var/www/.ssh/known_hosts
```

## 6. Tester la connexion

```bash
# Depuis le serveur Laravel — doit retourner "OK" sans aucun warning
sudo -u www-data ssh -i /etc/rxpress/ssh_id rxpress-deploy@<hestia-host> "echo OK"

# Lister les utilisateurs Hestia pour trouver le bon username
sudo -u www-data ssh -i /etc/rxpress/ssh_id rxpress-deploy@<hestia-host> \
  "sudo /usr/local/hestia/bin/v-list-users json"

# Tester une commande Hestia avec le bon username (ex: cpserver)
sudo -u www-data ssh -i /etc/rxpress/ssh_id rxpress-deploy@<hestia-host> \
  "sudo /usr/local/hestia/bin/v-list-web-domains <hestia-username> json"
```

## 7. Retirer le mot de passe du .env

Une fois les tests validés, supprimer `SSH_PASSWORD` du `.env` et du fichier `.env.example`.
