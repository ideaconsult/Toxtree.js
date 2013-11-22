#!/bin/bash

minimize=0
outdir='../www'
jsdir='../scripts'
cssdir='../styles'
htmldir='..'
target='toxstudy jtoxkit'
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
				target="$1 $target"
			fi
	esac
	
	shift
done

outJS="$outdir/jtoxkit.js"
outCSS="$outdir/jtoxkit.css"

echo "Clearing old files..."
rm -f $outJS
rm -f $outCSS

echo "Processing targets [$target]..."
echo "Merging JS files from [$jsdir] ..."
for t in ${target[@]}; do
	if [ -e "$jsdir/$t.js" ]; then
		cat "$jsdir/$t.js" >> $outJS
	fi
done

echo "Adding html2js transformed ones from [$htmldir]..."
for t in ${target[@]}; do
	if [ -e "$htmldir/$t.html" ]; then
		./html2js.pl "$htmldir/$t.html" >> $outJS
	fi
done

if [ $minimize -eq 1 ]; then
	echo "Minification..."
	./jsminify.pl $outJS > "$outdir/jtoxkit.min.js"
fi

echo "Merging CSS files from [$cssdir] ..."
for t in ${target[@]}; do
	if [ -e "$cssdir/$t.css" ]; then
		cat "$cssdir/$t.css" >> $outCSS
	fi
done

echo "Done."
