#!/usr/bin/perl -w

open (IN, "< $ARGV[0]") || die "Can't open the input file: " . $ARGV[0] . "!";
open (OUT, "> $ARGV[1]") || die "Can't open the output file: " . $ARGV[1] . "!";

my @variables = ();
my $lastVar = '';

foreach my $line (<IN>) {
	chomp $line;
	
	if (($newVar) = ($line =~ m/^<!--\[\[\s*(.+)\s*-->/)) {
		push @variables, ($newVar);
		if ($lastVar ne '') {
			print OUT '"";', "\n","\n";
		}
		$lastVar = $newVar;
		print OUT $lastVar, " = ", "\n";
	}
	elsif (($newVar) = ($line =~ m/^<!--(.*)\]\]-->/)) {
		print OUT '"";', $newVar, "\n", "\n";
		pop @variables;
		if ($#variables >= 0){
			$lastVar = $variables[$#variables];
			print OUT $lastVar, " += ", "\n";
		} else {
			$lastVar = '';
		}
			
	}
	elsif ($lastVar ne '') {
		$line =~ s/"/\\"/g;
		print OUT '"' . $line . '" +', "\n";
	}
}

close(IN);
close(OUT);
