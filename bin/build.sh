#!/bin/bash

minimize=0
outdir='../www'
jsdir='../scripts'
cssdir='../styles'
htmldir='..'
target='toxquery toxcompound toxdataset toxmodel toxsubstance toxcomposition toxstudy toxauth toxlog toxendpoint'
libs=()
tools=''
append=0
clean=0

# test the parameters first
while (( "$#" )); do
	case $1 in
		--html)
			append=0
			shift
			htmldir=$1
			;;
		--output)
			append=0
			shift
			outdir=$1			
			;;
		--css)
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
		--clean|-c)
			clean=1
			;;
		--target)
			target=''
			append=1
			;;
		--lib|-l)
			shift
			libs+=($1)
			;;
		--tool|-t)
			shift
			libs+=($1)
			tools="$tools $1 "
			;;
		--help|-h)
			echo "Usage: build.sh [options]"
			echo "Options can be one or more from the following:"
			echo
			echo "    [--min | -m]            : run minification of the output js, producing additional .min.js file."
			echo "    [--clean | -c]          : clean all pre-existing files in the output folder."
			echo "    [--html <html dir>]     : the directory where html files live. Default is [..]."
			echo "    [--out <output dir>]    : the directory where output files should be put. Default is [../www]."
			echo "    [--css <styles dir>]    : the directory where styling files live. Default is [../styles]."
			echo "    [--js <js dir>]         : the directory where script files live. Default is [../scripts]."
			echo "    [--target <kit list>]   : list of kits to be included. Omit jtoxkit. Default are all of them."
			echo "    [--lib | -l <filename>] : html file name, referring to some external library (tool)."
			echo "    [--tool | -t <filename>]: html file name, referring to some internal tool."
			echo "    [--help | -h]           : this help."
			echo 
			echo "Better call like this: build.sh -m"
			exit -1
			;;
		*)
			if [ $append -eq 1 ]; then
				target="$target tox$1"
			fi
	esac
	
	shift
done

pushd $outdir > /dev/null
if [ $clean -eq 1 ]; then
	echo "Clearing old files..."
	rm -rf *
fi
outdir=`pwd`
popd > /dev/null

# First prepare the libraries, if any
curdir=`pwd`

for l in "${libs[@]}"; do
	base=$(basename $l)
	name="${base%.*}"
	
	echo "Backing tool [$name]..."
	pushd $(dirname $l) > /dev/null
	if [[ "$tools" =~ "$name" ]]; then
		"$curdir/htmlextract.pl" --css --include $name <$base >"$outdir/$name.css"
		"$curdir/htmlextract.pl" --js --include $name <$base >"$outdir/$name.js"
	else
		"$curdir/htmlextract.pl" --css --exclude jquery <$base >"$outdir/$name.css"
		"$curdir/htmlextract.pl" --js --exclude jquery <$base >"$outdir/$name.js"
	fi
	"$curdir/html2js.pl" --trim --body-var "jT.tools['$name']" <$base >>"$outdir/$name.js"
	popd > /dev/null
done


# Extract the version and prepare the outputs
version=`sed -En -e 's/^[ \t]+version:[ \t]+"([0-9\.]+)",[ \t]+\/\/.+$/\1/p' $jsdir/jtoxkit.js`
echo "Version: $version..."

outJS="$outdir/jtoxkit-${version}.js"
outCSS="$outdir/jtoxkit-${version}.css"

# form the final target list
target="ccLib jtoxkit $target"

# start the building process...
echo "Processing targets [$target]..."
echo "Merging JS files from [$jsdir] ..."
for t in ${target[@]}; do
	if [ -e "$jsdir/$t.js" ]; then
		cat "$jsdir/$t.js" >> $outJS
	fi
done

echo "Adding html->js transformed ones from [$htmldir]..."
for t in ${target[@]}; do
	if [ -e "$htmldir/$t.html" ]; then
		./html2js.pl < "$htmldir/$t.html" >> $outJS
	fi
done

if [ $minimize -eq 1 ]; then
	echo "Minification..."
	./jsminify.pl $outJS > "$outdir/jtoxkit-${version}.min.js"
fi

echo "Merging CSS files from [$cssdir] ..."
for t in ${target[@]}; do
	if [ -e "$cssdir/$t.css" ]; then
		cat "$cssdir/$t.css" >> $outCSS
	fi
done

echo "Done."
