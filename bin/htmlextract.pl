#!/usr/bin/perl -w

my $what = 'js';
my $outIt = 0;
my @include = ();
my @exclude = ();

while (my $arg = shift) {
	if ($arg eq '--include') {
		push (@include, shift);
	} elsif ($arg eq '--exclude') {
		push (@exclude, shift);
	} else {
		($what) = ($arg =~ m/^\-+(.+)$/);
	}
}

my $incPattern = '.*(' . join('|', @include) . ').*';
my $excPattern = '.*(' . join('|', @exclude) . ').*';

foreach my $line (<STDIN>) {
	chomp $line;

	if ($what eq 'css') {
		if (($file) = ($line =~ m/^\s*<link\s+.*href=\"(.+\.css)\".*$/)) {
			dump_file($file);
		}
		elsif ($line =~ m/^\s*<style.*>\s*$/) {
			$outIt++;
		}
		elsif ($line =~ m/^\s*<\/style>\s*$/) {
			$outIt--;
		}
		elsif ($outIt) {
			print $line;
		}
	}
	else { 
		if (($file) = ($line =~ m/^\s*<script\s+.*src=\"(.+)\".*$/)) {
			dump_file($file);
		}
		elsif ($line =~ m/^\s*<script.*>\s*$/) {
			$outIt++;
		}
		elsif ($line =~ m/^\s*<\/script>\s*$/) {
			$outIt--;
		}
		elsif ($outIt) {
			print $line;
		}
	}
}

sub dump_file {
	my $f = $_[0];
	if (@include && !($f =~ /$incPattern/)) {
		return;
	} elsif (!@include && @exclude && $f =~ /$excPattern/) {
		return;
	}
	open (IN, "<" . $f) || die ("Failed to open: " . $f . "\r\n");
	print STDOUT <IN>;
	close (IN);
}
