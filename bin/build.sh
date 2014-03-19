#!/bin/bash

minimize=0
outdir='../www'
jsdir='../scripts'
cssdir='../styles'
htmldir='..'
target='toxstudy'
libs=''
append=0

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
		--target|-t)
			target=''
			append=1
			;;
		--lib|-l)
			shift;
			libs+=($1)
			echo "Lib: $1"
			;;
		--help|-h)
			echo "Usage: build.sh [options]"
			echo "Options can be one or more from the following:"
			echo
			echo "    [--min | -m]           : run minification of the output js, producing additional .min.js file."
			echo "    [--html <html dir>]    : the directory where html files live. Default is [..]."
			echo "    [--out <output dir>]   : the directory where output files should be put. Default is [../www]."
			echo "    [-css <styles dir>]    : the directory where styling files live. Default is [../styles]."
			echo "    [--js <js dir>]        : the directory where script files live. Default is [../scripts]."
			echo "    [--target <kit list>]  : list of kits to be included. Omit jtoxkit. Default [toxstudy]."
			echo "    [--lib | -l <filename>]: html file name, referring to some external library."
			echo "    [--help | -h]          : this help."
			echo 
			echo "Default is like: build.sh --html .. --out ../www --css ../styles --js ../script --target jtoxkit toxstudy"
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
outdir=`pwd`
popd > /dev/null

outJS="$outdir/jtoxkit.js"
outCSS="$outdir/jtoxkit.css"

echo "Clearing old files..."
rm -f "$outdir/*.js"
rm -f "$outdir/*.css"

# First prepare the libraries, if any
curdir=`pwd`
for l in "${libs[*]}"; do
	base=$(basename $l)
	name="${base%.*}"
	
	echo "Backing library [$name]..."
	pushd $(dirname $l) > /dev/null
	"$curdir/htmlextract.pl" --css <$base >"$outdir/$name.css"
	"$curdir/htmlextract.pl" --js <$base >"$outdir/$name.js"
	"$curdir/html2js.pl" --body-var --trim "jToxKit.templates['$name']" <$base >>"$outdir/$name.js"
	popd > /dev/null
done
# form the final target list
target="common toxdataset $target jtoxkit"

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
	./jsminify.pl $outJS > "$outdir/jtoxkit.min.js"
fi

echo "Merging CSS files from [$cssdir] ..."
for t in ${target[@]}; do
	if [ -e "$cssdir/$t.css" ]; then
		cat "$cssdir/$t.css" >> $outCSS
	fi
done

echo "Done."
