$(document).ready(function() {
	function createMessage($recipients,$message) {
		return $.post('scripts/messages_script.php', {action:'createMessage',recipients:$recipients, message:$message});
	}

	function availableMessages() {
		return $.post('scripts/messages_script.php', {action:'displayMessages'}).done(function(data) {
			$("div#messagedisplay").append(data);
		});
	}

	$("div#newMessage form").submit(function() {
		event.preventDefault();

		var $recipients = $(this).find("input[name='recipients']").val();
		var $message = $(this).find("input[name='message']").val();
		$posting = createMessage($recipients,$message);
		$posting.done(function(data) {
			console.log(data);
			$("div#newMessage").append(data);
		});
	});

	availableMessages();


});