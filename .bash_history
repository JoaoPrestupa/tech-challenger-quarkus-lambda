git config --global user.name "Henrique Alves"
git config --global user.email "henriquaalves2020@gmail.com"
git init
ssh -T git@github.com
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
clip < ~/.ssh/id_ed25519.pub
ssh -T git@github.com
cat ~/.ssh/id_ed25519.pub
ssh -vT git@github.com
[200~ssh-add -D~
ssh-add -D
ssh-add ~/.ssh/id_ed25519
ssh-add -l
ssh -T git@github.com
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINSRhV2a+y21LPGcZv9sIvrffJ8LqmMD35j+yXv9c3yV henriquaalves2020@gmail.com
cat ~/.ssh/id_ed25519.pub
ssh -T git@github.com
git clone https://github.com/JoaoPrestupa/tech-challenger-quarkus-lambda.git
git clone https://github.com/engemap/arcgis-exb-widgets.git
git clone https://github.com/engemap/sigApucaranaT.git
git clone https://github.com/engemap/arcgis-exb-api.git
git clone https://github.com/engemap/sig-exb-client.git
git clone https://github.com/engemap/bic_webservice_api.git
git clone https://github.com/engemap/arcgis-users-control-client.git
