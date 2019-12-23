module.exports = {
  consumer_key: 'FILLME_CONSUMER_KEY',
  consumer_secret: 'FILLME_CONSUMER_SECRET',
  access_token_key: 'FILLME_ACCESS_TOKEN_KEY',
  access_token_secret: 'FILLME_ACCES_TOKEN_SECRET',

  tweetObjectOrdeal: function(t){
		// Must be a reply or a quote
		if (t.in_reply_to_status_id_str == null && !t.is_quote_status) return false

		var text = t.text

		// Must have text and contain OK boomer (pics and URLs removed)
		if (text == undefined || text.length < 8) return false

		// Must contain OK Boomer
		if (!text.match(/ok.?.?boomer/gi)) return false

		// Remove 1 URL
		text = text.replace(/https?:\/\/[^ ]*/i, '')

		// Remove 1 image
		text = text.replace(/pic\.twitter\.com\/[^ ]*/i, '')

		// Remove mentions
		var oldtext = text
		text = oldtext.replace(/@[^ ]+ ?/gi, '')
		while (text.length < oldtext.length) {
			oldtext = text
			text = oldtext.replace(/@[^ ]+ ?/gi, '')
		}

		// Then, it must not be too short
		if (text.length > 20) return false
		else return true
	}
}
