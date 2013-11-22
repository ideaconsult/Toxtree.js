#!/usr/bin/perl -w

open (IN, "< $ARGV[0]") || die "Can't open the input file: " . $ARGV[0] . "!";

my @variables = ();
my $lastVar = '';

foreach my $line (<IN>) {
	chomp $line;
	
	if (($newVar) = ($line =~ m/^<!--\[\[\s*(.+)\s*-->/)) {
		push @variables, ($newVar);
		if ($lastVar ne '') {
			print STDOUT '"";', "\n","\n";
		}
		$lastVar = $newVar;
		print STDOUT $lastVar, " = ", "\n";
	}
	elsif (($newVar) = ($line =~ m/^<!--(.*)\]\]-->/)) {
		print STDOUT '"";', $newVar, "\n", "\n";
		pop @variables;
		if ($#variables >= 0){
			$lastVar = $variables[$#variables];
			print STDOUT $lastVar, " += ", "\n";
		} else {
			$lastVar = '';
		}
			
	}
	elsif ($lastVar ne '') {
		$line =~ s/"/\\"/g;
		print STDOUT '"' . $line . '" +', "\n";
	}
}

close(IN);
