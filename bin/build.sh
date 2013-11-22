#!/bin/bash

minimize=0
outdir='../www'
jsdir='../scripts'
cssdir='../styles'
htmldir='..'
target='jtoxkit toxstudy'
append=0

# test the parameters first
while (( "$#" )); do
	case $1 in
		--html)
			append=0
			shift
			htmldir=$1
			;;
		--output|--out)
			append=0
			shift
			outdir=$1
			;;
		--css|--styles)
			append=0
			shift
			cssdir=$1
			;;
		--scripts|--js)
			append=0
			shift
			jsdir=$1
			;;
		--min|-m)
			append=0
			minimize=1
			;;
		--target|-t)
			target='jtoxkit'
			append=1
			;;
		--help|-h)
			echo "Usage: build.sh [--min] [--html <html dir>] [--out <output dir>] [-css <styles dir>] [--js <js dir>] [--target (toxstudy)] [--help]"
			echo
			echo "Default is like: build.sh --html .. --out ../www --css ../styles --js ../script --target jtoxkit toxstudy"
			exit -1
			;;
		*)
			if [ $append -eq 1 ]; then
				target="$target $1"
			fi
	esac
	
	shift
done

echo "Building with parameters: "
echo "html = $htmldir"
echo "css = $cssdir"
echo "js = $jsdir"
echo "out = $outdir"
echo "minimize = $minimize"
echo "target = $target"

outJS="$outdir/jtoxkit.js"
outCSS="$outdir/jtoxkit.css"

echo "Merging JS files..."
for t in ${target[@]}; do
	if [ -e "$jsdir/$t.js" ]; then
		cat "$jsdir/$t.js" >> "$outJS"
	fi
done

echo "Adding html2js transformed ones..."
for t in ${target[@]}; do
	if [ -e "$htmldir/$t.html" ]; then
		./html2js.pl "$htmldir/$t.html" >> "$outJS"
	fi
done

echo "Minification..."

echo "Merging CSS files..."
for t in ${target[@]}; do
	if [ -e "$cssdir/$t.css" ]; then
		cat "$cssdir/$t.css" >> "$outCSS"
	fi
done

echo "Done."
