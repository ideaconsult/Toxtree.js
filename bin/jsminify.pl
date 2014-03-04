#!/usr/bin/perl -w

use JSMinifier qw(minify);

open (IN, "< $ARGV[0]") || die "Can't open the input file: " . $ARGV[0] . "!";

minify(input => *IN, outfile => *STDOUT);

close(IN);
