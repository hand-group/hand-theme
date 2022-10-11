#! /bin/bash

font_bold=$(tput bold)
font_normal=$(tput sgr0)

read -p "👀 Did you copy this script into an empty git repository before executing? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
	# create hugo skeleton
	hugo new site quickstart
	mv quickstart/* .
	rm -r quickstart

	# install hand-theme
	git submodule add https://github.com/hand-group/hand-theme.git themes/hand-theme
	cp themes/hand-theme/config.yaml .
	cp themes/hand-theme/Dockerfile .
	cp themes/hand-theme/captain-definition .
	cp themes/hand-theme/package.json .
	cp themes/hand-theme/tailwind.config.js .
	cp themes/hand-theme/.gitignore .
	cp themes/hand-theme/.prettierignore .
	cp themes/hand-theme/data/meta.yaml data/
	cp themes/hand-theme/data/seo.yaml data/
	rm config.toml

	# install dependencies
	npm install

	# finish setup
	echo ""
	echo "#############################"
	echo "🚀 Setup finished"
	echo "#############################"
	echo ""
	echo "✅ Todos:"
	echo "1. Update ${font_bold}config.yaml${font_normal} file"
	echo "2. Update ${font_bold}data/meta.yaml${font_normal} file"
	echo "3. Update ${font_bold}data/seo.yaml${font_normal} file"
	echo "4. Add content and site specific layouts"

	rm setup_hugo.sh
else
	echo "❌ Setup canceled"
fi
