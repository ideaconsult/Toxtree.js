#!/usr/bin/perl -w

my $autoBody = 0;
my $varName = '';
my $doTrim = 0;

while (my $arg = shift) {
	if ($arg eq '--body-var') {
		$varName = shift;
		$autoBody++;
	} elsif ($arg eq '--trim') {
		$doTrim++;
	} else {
		die ("Unknown parameter: " . $arg);
	}
}

my @variables = ();
my $lastVar = '';

foreach my $line (<STDIN>) {
	chomp $line;
	
	if (($newVar) = ($line =~ m/^<!--\[\[\s*(.*)\s*-->/) or ($line =~ m/^\s*<body.*>/ and $autoBody)) {
		if ($line =~ m/^\s*<body.*>/) {
			$newVar = $varName;
		}
		push @variables, ($newVar);
		if ($lastVar ne '') {
			print STDOUT '"";', "\n","\n";
		}
		$lastVar = $newVar;
		print STDOUT $lastVar, " = ", "\n";
	}
	elsif (($text) = ($line =~ m/^<!--(.*)\]\]-->/) or ($line =~ m/^\s*<\/body>/ and $autoBody)) {
		if ($line =~ m/^\s*<\/body>/) {
			$text = '';
		}
	
		print STDOUT '"";', $text, "\n", "\n";
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
		if ($doTrim) {
			$line =~ s/^\s+|\s+$//g;
		}
		print STDOUT '"' . $line . '" +', "\n";
	}
}
